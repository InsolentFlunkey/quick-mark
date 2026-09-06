//! Canonical ownership primitives used under the editor coordinator lock.
//! The integration layer must serialize access and derive caller identity from the native window.
use std::collections::HashMap;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize)]
pub struct Owner {
    pub document_id: String,
    pub window_label: String,
}
#[derive(Clone, Debug)]
struct Transfer {
    token: u64,
    target: String,
}
#[derive(Clone, Debug)]
struct Claim {
    owner: Owner,
    transfer: Option<Transfer>,
}
#[derive(Default)]
pub struct DocumentRegistry {
    claims: HashMap<PathBuf, Claim>,
    next_token: u64,
}

/// Existing paths resolve symlinks; new Save As paths resolve their existing parent.
/// Canonical path identity does not merge distinct hard links.
pub fn canonical_document_path(path: &Path) -> Result<PathBuf, String> {
    match path.canonicalize() {
        Ok(path) => Ok(path),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            let name = path.file_name().ok_or("Missing filename")?;
            let parent = path
                .parent()
                .filter(|p| !p.as_os_str().is_empty())
                .unwrap_or(Path::new("."));
            Ok(parent.canonicalize().map_err(|e| e.to_string())?.join(name))
        }
        Err(error) => Err(error.to_string()),
    }
}
impl DocumentRegistry {
    pub fn owner(&self, path: &Path) -> Result<Option<Owner>, String> {
        let key = canonical_document_path(path)?;
        Ok(self.claims.get(&key).map(|claim| claim.owner.clone()))
    }
    /// Reserve before reading/writing; release on failure. An existing owner is returned unchanged.
    pub fn claim(&mut self, path: &Path, owner: Owner) -> Result<Owner, String> {
        if owner.document_id.is_empty() || owner.window_label.is_empty() {
            return Err("Empty owner identity".into());
        }
        let key = canonical_document_path(path)?;
        Ok(self.claim_key(key, owner))
    }
    pub fn claim_key(&mut self, key: PathBuf, owner: Owner) -> Owner {
        let claim = self.claims.entry(key).or_insert(Claim {
            owner,
            transfer: None,
        });
        claim.owner.clone()
    }
    fn owned(&mut self, path: &Path, owner: &Owner) -> Result<&mut Claim, String> {
        let claim = self.claims.get_mut(path).ok_or("Document is not claimed")?;
        if &claim.owner != owner {
            return Err("Document belongs to another owner".into());
        }
        Ok(claim)
    }
    pub fn release(&mut self, path: &Path, owner: &Owner) -> Result<(), String> {
        let key = canonical_document_path(path)?;
        self.release_key(&key, owner)
    }
    pub fn release_key(&mut self, key: &Path, owner: &Owner) -> Result<(), String> {
        if self.owned(key, owner)?.transfer.is_some() {
            return Err("Transfer in progress".into());
        }
        self.claims.remove(key);
        Ok(())
    }
    pub fn owner_key(&self, key: &Path) -> Option<Owner> {
        self.claims.get(key).map(|claim| claim.owner.clone())
    }
    pub fn release_window(&mut self, label: &str) {
        self.claims
            .retain(|_, claim| claim.owner.window_label != label);
    }
    pub fn begin_transfer(
        &mut self,
        path: &Path,
        owner: &Owner,
        target: String,
    ) -> Result<u64, String> {
        self.begin_transfer_key(&canonical_document_path(path)?, owner, target)
    }
    pub fn begin_transfer_key(
        &mut self,
        path: &Path,
        owner: &Owner,
        target: String,
    ) -> Result<u64, String> {
        if target.is_empty() || target == owner.window_label {
            return Err("Invalid target window".into());
        }
        if self.owned(path, owner)?.transfer.is_some() {
            return Err("Transfer in progress".into());
        }
        self.next_token = self
            .next_token
            .checked_add(1)
            .ok_or("Transfer token exhausted")?;
        let token = self.next_token;
        self.owned(path, owner)?.transfer = Some(Transfer { token, target });
        Ok(token)
    }
    pub fn acknowledge(
        &mut self,
        path: &Path,
        owner: &Owner,
        target: &str,
        token: u64,
    ) -> Result<(), String> {
        self.acknowledge_key(&canonical_document_path(path)?, owner, target, token)
    }
    pub fn acknowledge_key(
        &mut self,
        path: &Path,
        owner: &Owner,
        target: &str,
        token: u64,
    ) -> Result<(), String> {
        let claim = self.owned(path, owner)?;
        let transfer = claim.transfer.as_ref().ok_or("No transfer in progress")?;
        if transfer.token != token || transfer.target != target {
            return Err("Invalid transfer acknowledgement".into());
        }
        claim.owner.window_label = target.into();
        claim.transfer = None;
        Ok(())
    }
    pub fn cancel(&mut self, path: &Path, owner: &Owner, token: u64) -> Result<(), String> {
        self.cancel_key(&canonical_document_path(path)?, owner, token)
    }
    pub fn cancel_key(&mut self, path: &Path, owner: &Owner, token: u64) -> Result<(), String> {
        let claim = self.owned(path, owner)?;
        if claim.transfer.as_ref().map(|t| t.token) != Some(token) {
            return Err("Invalid transfer cancellation".into());
        }
        claim.transfer = None;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn owner(window: &str) -> Owner {
        Owner {
            document_id: "document-1".into(),
            window_label: window.into(),
        }
    }
    fn path() -> PathBuf {
        std::env::current_dir().unwrap().join("Cargo.toml")
    }
    #[test]
    fn aliases_cannot_create_conflicting_owners() {
        let mut registry = DocumentRegistry::default();
        assert_eq!(
            registry.claim(&path(), owner("main")).unwrap(),
            owner("main")
        );
        let alias = path().parent().unwrap().join("./Cargo.toml");
        assert_eq!(
            registry.claim(&alias, owner("other")).unwrap(),
            owner("main")
        );
        assert!(registry.release(&path(), &owner("other")).is_err());
        registry.release(&alias, &owner("main")).unwrap();
        assert_eq!(registry.owner(&path()).unwrap(), None);
    }
    #[test]
    fn transfer_keeps_source_until_valid_acknowledgement() {
        let mut registry = DocumentRegistry::default();
        registry.claim(&path(), owner("main")).unwrap();
        let token = registry
            .begin_transfer(&path(), &owner("main"), "target".into())
            .unwrap();
        assert_eq!(registry.owner(&path()).unwrap(), Some(owner("main")));
        assert!(registry.release(&path(), &owner("main")).is_err());
        assert!(registry
            .acknowledge(&path(), &owner("main"), "wrong", token)
            .is_err());
        assert!(registry
            .acknowledge(&path(), &owner("main"), "target", token + 1)
            .is_err());
        registry.cancel(&path(), &owner("main"), token).unwrap();
        let next = registry
            .begin_transfer(&path(), &owner("main"), "target".into())
            .unwrap();
        assert!(registry
            .acknowledge(&path(), &owner("main"), "target", token)
            .is_err());
        registry
            .acknowledge(&path(), &owner("main"), "target", next)
            .unwrap();
        assert_eq!(registry.owner(&path()).unwrap(), Some(owner("target")));
        assert!(registry.cancel(&path(), &owner("main"), next).is_err());
    }
    #[test]
    fn new_save_paths_require_an_existing_parent() {
        let parent = std::env::current_dir().unwrap();
        assert_eq!(
            canonical_document_path(&parent.join("future-document.md")).unwrap(),
            parent.canonicalize().unwrap().join("future-document.md")
        );
        assert!(
            canonical_document_path(&parent.join("missing-directory/future-document.md")).is_err()
        );
    }
}
