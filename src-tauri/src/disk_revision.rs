//! Exact disk observations and revision-checked replacement writes.
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct Revision {
    pub content: Option<Vec<u8>>,
    identity: String,
}
fn identity(metadata: &fs::Metadata) -> String {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        format!(
            "{}:{}:{:?}:{}:{}",
            metadata.dev(),
            metadata.ino(),
            metadata.modified(),
            metadata.ctime(),
            metadata.ctime_nsec()
        )
    }
    #[cfg(not(unix))]
    {
        format!(
            "{:?}:{:?}:{}",
            metadata.created(),
            metadata.modified(),
            metadata.len()
        )
    }
}
pub(crate) fn observe(path: &Path) -> Result<Revision, String> {
    let before = match fs::metadata(path) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return Ok(Revision {
                content: None,
                identity: String::new(),
            })
        }
        Err(error) => return Err(format!("Could not inspect {}: {error}", path.display())),
    };
    if !before.is_file() {
        return Err("The document path is no longer a regular file.".into());
    }
    let content = fs::read(path).map_err(|e| format!("Could not read {}: {e}", path.display()))?;
    let after = fs::metadata(path).map_err(|e| e.to_string())?;
    if identity(&before) != identity(&after) || after.len() != content.len() as u64 {
        return Err("The file changed while being read. Retry.".into());
    }
    Ok(Revision {
        content: Some(content),
        identity: identity(&after),
    })
}
impl Revision {
    pub fn text(&self) -> Result<String, String> {
        String::from_utf8(
            self.content
                .clone()
                .ok_or("The file is missing or moved.")?,
        )
        .map_err(|_| "The file is not valid UTF-8 text.".into())
    }
}
static NEXT_TEMP: AtomicU64 = AtomicU64::new(1);
pub(crate) fn replace(path: &Path, expected: &Revision, content: &str) -> Result<Revision, String> {
    if observe(path)? != *expected {
        return Err("The file changed again. Review it before saving.".into());
    }
    if expected.content.is_some() && !crate::document_writable(path.to_string_lossy().into_owned())?
    {
        return Err("The file is read-only. Use Save As.".into());
    }
    let parent = path.parent().ok_or("Missing destination directory")?;
    let temporary = parent.join(format!(
        ".quickmark-{}-{}.tmp",
        std::process::id(),
        NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
    ));
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temporary)
        .map_err(|e| e.to_string())?;
    let result = (|| {
        if expected.content.is_some() {
            file.set_permissions(fs::metadata(path).map_err(|e| e.to_string())?.permissions())
                .map_err(|e| e.to_string())?;
        }
        file.write_all(content.as_bytes())
            .map_err(|e| e.to_string())?;
        file.sync_all().map_err(|e| e.to_string())?;
        drop(file);
        if observe(path)? != *expected {
            return Err("The file changed again. Review it before saving.".into());
        }
        // Atomic replacement avoids truncating the original on a failed write. Other
        // processes do not share our lock: a final compare/rename race remains.
        fs::rename(&temporary, path).map_err(|e| e.to_string())?;
        observe(path)
    })();
    if temporary.exists() {
        let _ = fs::remove_file(&temporary);
    }
    result
}
