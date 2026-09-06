//! Caller-bound editor ownership and memory-only transfer transactions.
use crate::document_registry::{canonical_document_path, DocumentRegistry, Owner};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{HashMap, VecDeque};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{Emitter, Manager};

#[derive(Clone)]
struct Document {
    owner: Owner,
    key: PathBuf,
    ready: bool,
}
#[derive(Clone)]
struct Transfer {
    source: Owner,
    target: String,
    snapshot: Value,
    key: Option<PathBuf>,
    registry_token: Option<u64>,
    status: &'static str,
}
#[derive(Clone, Default, Serialize)]
pub struct History {
    revision: u64,
    paths: Vec<String>,
}
#[derive(Default)]
pub struct Coordinator {
    registry: DocumentRegistry,
    documents: HashMap<String, Document>,
    transfers: HashMap<String, Transfer>,
    editors: Vec<String>,
    launches: HashMap<String, VecDeque<String>>,
    next: u64,
    history: Option<History>,
    canceled: HashMap<String, String>,
    untitled: HashMap<String, String>,
}
pub type SharedCoordinator = Mutex<Coordinator>;

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Request {
    Ready,
    Poll,
    Focused,
    Claim {
        id: String,
        path: String,
    },
    Adopt {
        id: String,
    },
    Release {
        id: String,
    },
    Write {
        id: String,
        path: String,
        content: String,
        save_as: bool,
    },
    Focus {
        id: String,
    },
    Detach {
        token: String,
        snapshot: Value,
    },
    Stage,
    Acknowledge {
        token: String,
    },
    TransferStatus {
        token: String,
        cancel: bool,
    },
    Close,
    History {
        operation: String,
        path: Option<String>,
        legacy: Option<Vec<String>>,
    },
}
fn owner(label: &str, id: &str) -> Owner {
    Owner {
        document_id: id.into(),
        window_label: label.into(),
    }
}
impl Coordinator {
    pub fn initial_launch(&mut self, path: String) {
        self.launches
            .entry("main".into())
            .or_default()
            .push_back(path);
    }
    fn editor(&self, label: &str) -> Result<(), String> {
        if self.editors.iter().any(|entry| entry == label) {
            Ok(())
        } else {
            Err("Editor window is not ready".into())
        }
    }
    fn idle(&self, label: &str) -> Result<(), String> {
        if self
            .transfers
            .values()
            .any(|t| t.status == "pending" && (t.source.window_label == label || t.target == label))
        {
            Err("Document transfer in progress".into())
        } else {
            Ok(())
        }
    }
    fn claim(&mut self, label: &str, id: &str, path: &str) -> Result<Value, String> {
        self.editor(label)?;
        self.idle(label)?;
        if id.is_empty() {
            return Err("Missing document identity".into());
        }
        let key = canonical_document_path(Path::new(path))?;
        if let Some(existing) = self.registry.owner_key(&key) {
            let ready = self
                .documents
                .get(&existing.document_id)
                .is_some_and(|d| d.ready);
            return Ok(json!({"owner": existing, "key": key, "ready": ready}));
        }
        if self.documents.contains_key(id) {
            return Err("Document already owns a path".into());
        }
        let claimed = self.registry.claim_key(key.clone(), owner(label, id));
        self.documents.insert(
            id.into(),
            Document {
                owner: claimed.clone(),
                key: key.clone(),
                ready: false,
            },
        );
        Ok(json!({"owner": claimed, "key": key, "ready": false}))
    }
    fn release(&mut self, label: &str, id: &str) -> Result<(), String> {
        self.idle(label)?;
        if self.untitled.get(id).is_some_and(|window| window != label) {
            return Err("Document belongs to another window".into());
        }
        self.untitled.remove(id);
        if let Some(document) = self.documents.get(id) {
            if document.owner != owner(label, id) {
                return Err("Document belongs to another window".into());
            }
            self.registry.release_key(&document.key, &document.owner)?;
            self.documents.remove(id);
        }
        Ok(())
    }
    fn write(
        &mut self,
        label: &str,
        id: &str,
        path: &str,
        content: &str,
        save_as: bool,
    ) -> Result<(), String> {
        self.editor(label)?;
        self.idle(label)?;
        crate::validate_document_path(Path::new(path))?;
        let key = canonical_document_path(Path::new(path))?;
        if id.trim().is_empty() {
            return Err("Missing document identity".into());
        }
        let caller = owner(label, id);
        if let Some(document) = self.documents.get(id) {
            if document.owner != caller || !document.ready {
                return Err("Document is not owned by this editor".into());
            }
        }
        if let Some(existing) = self.registry.owner_key(&key) {
            if existing != caller {
                return Err(
                    "This file is already open in another tab or window. Choose a different path."
                        .into(),
                );
            }
        }
        let previous = self.documents.get(id).map(|d| d.key.clone());
        if !save_as && previous.as_ref().is_some_and(|previous| previous != &key) {
            return Err(
                "The document path now resolves to a different file. Use Save As or reopen it."
                    .into(),
            );
        }
        if self.untitled.get(id).is_some_and(|window| window != label) {
            return Err("Document belongs to another window".into());
        }
        self.registry.claim_key(key.clone(), caller.clone());
        // Serialize reservation, write and identity commit. Failure retains the original claim.
        if let Err(error) = std::fs::write(&key, content) {
            if previous.as_ref() != Some(&key) {
                self.registry.release_key(&key, &caller)?;
            }
            return Err(format!("Could not write {}: {error}", key.display()));
        }
        if let Some(previous) = previous.filter(|previous| previous != &key) {
            self.registry.release_key(&previous, &caller)?;
        }
        self.untitled.remove(id);
        self.documents.insert(
            id.into(),
            Document {
                owner: caller,
                key,
                ready: true,
            },
        );
        Ok(())
    }
    fn begin(&mut self, label: &str, token: String, snapshot: Value) -> Result<String, String> {
        self.editor(label)?;
        if token.trim().is_empty() {
            return Err("Missing transfer token".into());
        }
        if self.canceled.contains_key(&token) || self.transfers.contains_key(&token) {
            return Err("Transfer token already used".into());
        }
        self.idle(label)?;
        validate_snapshot(&snapshot)?;
        let id = snapshot["documentId"]
            .as_str()
            .filter(|id| !id.is_empty())
            .ok_or("Missing document identity")?
            .to_owned();
        if snapshot["version"] != 1
            || !snapshot["document"].is_object()
            || !snapshot["view"].is_object()
        {
            return Err("Invalid transfer snapshot".into());
        }
        let source = owner(label, &id);
        if self.untitled.get(&id).is_some_and(|window| window != label) {
            return Err("Document belongs to another window".into());
        }
        let key = match snapshot["document"]["filePath"].as_str() {
            Some(path) => {
                let document = self.documents.get(&id).ok_or("Document is not claimed")?;
                if document.owner != source || !document.ready {
                    return Err("Document is not owned by this editor".into());
                }
                if canonical_document_path(Path::new(path))? != document.key {
                    return Err(
                        "Document path identity changed; reopen or Save As before moving it."
                            .into(),
                    );
                }
                Some(document.key.clone())
            }
            None if snapshot["document"]["filePath"].is_null()
                && !self.documents.contains_key(&id) =>
            {
                None
            }
            _ => return Err("Invalid document path".into()),
        };
        if self
            .transfers
            .values()
            .any(|t| t.source.document_id == id && t.status == "pending")
        {
            return Err("Document transfer in progress".into());
        }
        self.next += 1;
        let target = format!("editor-{}", self.next);
        let registry_token = key
            .as_ref()
            .map(|key| {
                self.registry
                    .begin_transfer_key(key, &source, target.clone())
            })
            .transpose()?;
        if key.is_none() {
            self.untitled.insert(id, label.into());
        }
        self.transfers.insert(
            token.clone(),
            Transfer {
                source,
                target,
                snapshot,
                key,
                registry_token,
                status: "pending",
            },
        );
        Ok(token)
    }
    fn status(
        &mut self,
        label: &str,
        token: &str,
        cancel: bool,
        acknowledge: bool,
    ) -> Result<Value, String> {
        if !self.transfers.contains_key(token) && cancel && !acknowledge {
            match self.canceled.get(token) {
                Some(source) if source != label => return Err("Wrong transfer participant".into()),
                _ => {
                    self.canceled.insert(token.into(), label.into());
                }
            }
            return Ok(json!({"status": "canceled", "target": ""}));
        }
        let transfer = self.transfers.get(token).ok_or("Unknown transfer")?.clone();
        if label != transfer.source.window_label && label != transfer.target {
            return Err("Wrong transfer participant".into());
        }
        if acknowledge && label != transfer.target {
            return Err("Wrong acknowledgement recipient".into());
        }
        if transfer.status == "pending" && (cancel || acknowledge) {
            if let (Some(key), Some(registry_token)) = (&transfer.key, transfer.registry_token) {
                if acknowledge {
                    self.registry.acknowledge_key(
                        key,
                        &transfer.source,
                        &transfer.target,
                        registry_token,
                    )?;
                    self.documents
                        .get_mut(&transfer.source.document_id)
                        .ok_or("Missing document")?
                        .owner
                        .window_label = transfer.target.clone();
                } else {
                    self.registry
                        .cancel_key(key, &transfer.source, registry_token)?;
                }
            }
            if acknowledge && transfer.key.is_none() {
                self.untitled
                    .insert(transfer.source.document_id.clone(), transfer.target.clone());
            }
            self.transfers.get_mut(token).unwrap().status =
                if acknowledge { "committed" } else { "canceled" };
            self.transfers.get_mut(token).unwrap().snapshot = Value::Null;
        }
        let transfer = &self.transfers[token];
        Ok(json!({"status": transfer.status, "target": transfer.target}))
    }
    fn stage(&mut self, label: &str) -> Value {
        // A new frontend in an already-ready window is a reload, not session restoration.
        if self.editors.iter().any(|entry| entry == label) {
            self.destroyed(label);
        }
        self.transfers.iter().find(|(_, t)| t.target == label && t.status != "committed")
            .map(|(token, t)| json!({"token": token, "snapshot": t.snapshot, "key": t.key, "status": t.status}))
            .unwrap_or(Value::Null)
    }
    pub fn destroyed(&mut self, label: &str) {
        let tokens: Vec<_> = self
            .transfers
            .iter()
            .filter(|(_, t)| {
                t.status == "pending" && (t.target == label || t.source.window_label == label)
            })
            .map(|(token, _)| token.clone())
            .collect();
        for token in tokens {
            let _ = self.status(label, &token, true, false);
        }
        self.registry.release_window(label);
        self.untitled.retain(|_, window| window != label);
        self.documents.retain(|_, d| d.owner.window_label != label);
        self.editors.retain(|entry| entry != label);
        let pending = self.launches.remove(label).unwrap_or_default();
        if let Some(target) = self.editors.last().cloned() {
            self.launches.entry(target).or_default().extend(pending);
        }
    }
    pub fn queue_launch(&mut self, path: String) -> Option<String> {
        let existing = canonical_document_path(Path::new(&path))
            .ok()
            .and_then(|key| self.registry.owner_key(&key));
        let target = existing
            .map(|o| o.window_label)
            .or_else(|| self.editors.last().cloned())?;
        self.launches
            .entry(target.clone())
            .or_default()
            .push_back(path);
        Some(target)
    }
    fn history(
        &mut self,
        file: &Path,
        operation: &str,
        path: Option<String>,
        legacy: Option<Vec<String>>,
    ) -> Result<History, String> {
        let mut history = match &self.history {
            Some(history) => history.clone(),
            None => {
                let paths: Vec<String> = match std::fs::read(file) {
                    Ok(bytes) => serde_json::from_slice(&bytes)
                        .map_err(|e| format!("Could not read Recent Files: {e}"))?,
                    Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                        legacy.unwrap_or_default()
                    }
                    Err(error) => return Err(error.to_string()),
                };
                History {
                    revision: 0,
                    paths: normalize_history(paths),
                }
            }
        };
        match operation {
            "get" => {}
            "clear" => history.paths.clear(),
            "add" | "remove" => {
                let path = path.ok_or("Missing recent path")?;
                history.paths.retain(|entry| entry != &path);
                if operation == "add" {
                    history.paths.insert(0, path);
                }
            }
            _ => return Err("Invalid history operation".into()),
        }
        history.paths = normalize_history(history.paths);
        if self.history.is_none() || operation != "get" {
            std::fs::create_dir_all(file.parent().ok_or("Missing config directory")?)
                .map_err(|e| e.to_string())?;
            let temporary = file.with_extension("tmp");
            std::fs::write(
                &temporary,
                serde_json::to_vec(&history.paths).map_err(|e| e.to_string())?,
            )
            .map_err(|e| e.to_string())?;
            std::fs::rename(&temporary, file).map_err(|e| e.to_string())?;
            history.revision += 1;
            self.history = Some(history.clone());
        }
        Ok(history)
    }
}
fn validate_snapshot(snapshot: &Value) -> Result<(), String> {
    let document = &snapshot["document"];
    let view = &snapshot["view"];
    let valid_string = |value: &Value| value.as_str().is_some_and(|s| !s.trim().is_empty());
    if snapshot["version"] != 1
        || !valid_string(&snapshot["documentId"])
        || document["version"] != 1
        || !document["content"].is_string()
        || !document["lastSavedContent"].is_string()
        || !valid_string(&document["displayName"])
        || !document["canSave"].is_boolean()
        || document.get("filePath").is_none()
        || !(document["filePath"].is_null() || valid_string(&document["filePath"]))
    {
        return Err("Invalid document transfer snapshot".into());
    }
    let start = view["selectionStart"].as_u64().ok_or("Invalid selection")?;
    let end = view["selectionEnd"].as_u64().ok_or("Invalid selection")?;
    if start > end
        || end > document["content"].as_str().unwrap().encode_utf16().count() as u64
        || !matches!(
            view["selectionDirection"].as_str(),
            Some("forward" | "backward" | "none")
        )
        || !matches!(
            view["preferences"]["mode"].as_str(),
            Some("both" | "input" | "preview")
        )
        || !view["preferences"]["swapped"].is_boolean()
        || !view["preferences"]["syncScrolling"].is_boolean()
    {
        return Err("Invalid transfer view state".into());
    }
    for key in [
        "editorScrollTop",
        "editorScrollLeft",
        "previewScrollTop",
        "previewScrollLeft",
    ] {
        if !view[key]
            .as_f64()
            .is_some_and(|number| number.is_finite() && number >= 0.0)
        {
            return Err("Invalid transfer scroll state".into());
        }
    }
    Ok(())
}
fn normalize_history(paths: Vec<String>) -> Vec<String> {
    let mut result = Vec::new();
    for path in paths {
        if !path.trim().is_empty() && !result.contains(&path) {
            result.push(path);
        }
        if result.len() == 10 {
            break;
        }
    }
    result
}
fn create_editor(app: &tauri::AppHandle, label: &str) -> Result<(), String> {
    tauri::WebviewWindowBuilder::new(app, label, tauri::WebviewUrl::App("index.html".into()))
        .title("QuickMark")
        .inner_size(1100.0, 760.0)
        .min_inner_size(640.0, 480.0)
        .build()
        .map(|_| ())
        .map_err(|e| e.to_string())
}
// Async command: native window creation must not run in a synchronous Windows IPC handler.
#[tauri::command]
pub async fn editor_command(
    window: tauri::WebviewWindow,
    app: tauri::AppHandle,
    state: tauri::State<'_, SharedCoordinator>,
    request: Request,
) -> Result<Value, String> {
    let label = window.label();
    if label != "main" && !label.starts_with("editor-") {
        return Err("This is not an editor window".into());
    }
    if let Request::Detach { snapshot, token } = request {
        let (token, target) = {
            let mut coordinator = state.lock().map_err(|e| e.to_string())?;
            let token = coordinator.begin(label, token, snapshot)?;
            (token.clone(), coordinator.transfers[&token].target.clone())
        };
        if let Err(error) = create_editor(&app, &target) {
            state
                .lock()
                .map_err(|e| e.to_string())?
                .status(label, &token, true, false)?;
            return Err(error);
        }
        return Ok(json!({"token": token}));
    }
    if let Request::Close = request {
        {
            state.lock().map_err(|e| e.to_string())?.idle(label)?;
        }
        return window
            .destroy()
            .map(|_| Value::Null)
            .map_err(|e| e.to_string());
    }
    // Never hold the coordinator lock across native UI operations.
    if let Request::Focus { id } = &request {
        let document = state
            .lock()
            .map_err(|e| e.to_string())?
            .documents
            .get(id)
            .cloned()
            .ok_or("Document is no longer open")?;
        if !document.ready {
            return Err("Document is still opening; try again shortly".into());
        }
        let target = app
            .get_webview_window(&document.owner.window_label)
            .ok_or("Owning window is unavailable")?;
        app.emit_to(
            document.owner.window_label.as_str(),
            "quickmark://focus-document",
            id,
        )
        .map_err(|e| e.to_string())?;
        target.show().map_err(|e| e.to_string())?;
        target.set_focus().map_err(|e| e.to_string())?;
        return Ok(Value::Null);
    }
    if let Request::TransferStatus { token, cancel } = &request {
        let result = state
            .lock()
            .map_err(|e| e.to_string())?
            .status(label, token, *cancel, false)?;
        if result["status"] == "canceled" {
            if let Some(target) = result["target"].as_str().filter(|target| *target != label) {
                if let Some(window) = app.get_webview_window(target) {
                    window.destroy().map_err(|e| e.to_string())?;
                }
            }
        }
        return Ok(result);
    }
    let mut coordinator = state.lock().map_err(|e| e.to_string())?;
    match request {
        Request::Ready => {
            if !coordinator.editors.iter().any(|entry| entry == label) {
                coordinator.editors.push(label.into());
            }
            Ok(Value::Null)
        }
        Request::Poll => Ok(json!(coordinator
            .launches
            .remove(label)
            .unwrap_or_default())),
        Request::Focused => {
            coordinator.editor(label)?;
            coordinator.editors.retain(|entry| entry != label);
            coordinator.editors.push(label.into());
            Ok(Value::Null)
        }
        Request::Claim { id, path } => coordinator.claim(label, &id, &path),
        Request::Adopt { id } => {
            let document = coordinator
                .documents
                .get_mut(&id)
                .ok_or("Missing reservation")?;
            if document.owner != owner(label, &id) {
                return Err("Wrong document owner".into());
            }
            document.ready = true;
            Ok(Value::Null)
        }
        Request::Release { id } => {
            coordinator.release(label, &id)?;
            Ok(Value::Null)
        }
        Request::Write {
            id,
            path,
            content,
            save_as,
        } => {
            coordinator.write(label, &id, &path, &content, save_as)?;
            Ok(Value::Null)
        }
        Request::Stage => Ok(coordinator.stage(label)),
        Request::Acknowledge { token } => coordinator.status(label, &token, false, true),
        Request::TransferStatus { token, cancel } => {
            coordinator.status(label, &token, cancel, false)
        }
        Request::History {
            operation,
            path,
            legacy,
        } => {
            let file = app
                .path()
                .app_config_dir()
                .map_err(|e| e.to_string())?
                .join("recent-files.json");
            let history = coordinator.history(&file, &operation, path, legacy)?;
            Ok(json!(history))
        }
        Request::Detach { .. } | Request::Close | Request::Focus { .. } => unreachable!(),
    }
}
pub fn on_window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    let Some(state) = window.try_state::<SharedCoordinator>() else {
        return;
    };
    let Ok(mut coordinator) = state.lock() else {
        return;
    };
    match event {
        tauri::WindowEvent::CloseRequested { api, .. } => {
            if coordinator.idle(window.label()).is_err() {
                api.prevent_close();
            }
        }
        tauri::WindowEvent::Destroyed => coordinator.destroyed(window.label()),
        _ => {}
    }
}
pub fn launch(app: &tauri::AppHandle, path: String) {
    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let target = {
            let state = handle.state::<SharedCoordinator>();
            let mut coordinator = state.lock().unwrap();
            coordinator.queue_launch(path.clone())
        };
        if let Some(target) = target {
            if let Some(window) = handle.get_webview_window(&target) {
                let _ = window.show();
                let _ = window.set_focus();
            }
        } else {
            let target = {
                let state = handle.state::<SharedCoordinator>();
                let mut coordinator = state.lock().unwrap();
                coordinator.next += 1;
                let target = format!("editor-{}", coordinator.next);
                coordinator
                    .launches
                    .entry(target.clone())
                    .or_default()
                    .push_back(path);
                target
            };
            if let Err(error) = create_editor(&handle, &target) {
                eprintln!("Could not open editor window: {error}");
            }
        }
    });
}

/// Reference examples may export copies, but must honor live editor ownership.
#[tauri::command]
pub fn write_document(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, SharedCoordinator>,
    path: String,
    content: String,
) -> Result<(), String> {
    if window.label() != "examples" {
        return Err("Use the editor ownership service to save documents".into());
    }
    let coordinator = state.lock().map_err(|e| e.to_string())?;
    let key = canonical_document_path(Path::new(&path))?;
    if coordinator.registry.owner_key(&key).is_some() {
        return Err("This file is already open in an editor. Choose a different path.".into());
    }
    crate::write_document_file(path, content)
}

#[cfg(test)]
mod tests {
    use super::*;
    struct Fixture(PathBuf);
    impl Fixture {
        fn new() -> Self {
            let path = std::env::temp_dir().join(format!(
                "quickmark-coordinator-{}-{}",
                std::process::id(),
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ));
            std::fs::create_dir_all(&path).unwrap();
            Self(path)
        }
        fn file(&self, name: &str) -> String {
            self.0.join(name).to_string_lossy().into_owned()
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            std::fs::remove_dir_all(&self.0).unwrap();
        }
    }
    fn coordinator() -> Coordinator {
        Coordinator {
            editors: vec!["main".into(), "other".into()],
            ..Default::default()
        }
    }
    fn snapshot(id: &str, path: Option<&str>) -> Value {
        json!({"version": 1, "documentId": id, "document": {"version": 1, "filePath": path, "content": "unsaved", "lastSavedContent": "saved", "displayName": "a.md", "canSave": true}, "view": {"selectionStart": 2, "selectionEnd": 4, "selectionDirection": "backward", "editorScrollTop": 0, "editorScrollLeft": 0, "previewScrollTop": 0, "previewScrollLeft": 0, "preferences": {"mode": "both", "swapped": false, "syncScrolling": true}}})
    }
    fn adopt(c: &mut Coordinator, id: &str) {
        c.documents.get_mut(id).unwrap().ready = true;
    }
    #[test]
    fn reservations_distinguish_pending_opens_and_reject_conflicting_writes() {
        let f = Fixture::new();
        let path = f.file("a.md");
        let mut c = coordinator();
        c.claim("main", "a", &path).unwrap();
        let duplicate = c.claim("other", "b", &path).unwrap();
        assert_eq!(duplicate["owner"]["document_id"], "a");
        assert_eq!(duplicate["ready"], false);
        assert!(c.write("other", "b", &path, "overwrite", true).is_err());
        adopt(&mut c, "a");
        assert_eq!(c.claim("other", "b", &path).unwrap()["ready"], true);
        assert!(c.release("other", "a").is_err());
        c.release("main", "a").unwrap();
        assert_eq!(
            c.claim("other", "b", &path).unwrap()["owner"]["document_id"],
            "b"
        );
    }
    #[test]
    fn failed_save_as_keeps_old_claim_and_success_releases_it() {
        let f = Fixture::new();
        let old = f.file("old.md");
        let bad = f.file("directory.md");
        std::fs::create_dir(&bad).unwrap();
        let mut c = coordinator();
        c.write("main", "a", &old, "saved", true).unwrap();
        assert!(c.write("main", "a", &bad, "edited", true).is_err());
        assert_eq!(std::fs::read_to_string(&old).unwrap(), "saved");
        assert!(c.registry.owner_key(Path::new(&bad)).is_none());
        assert!(c.registry.owner_key(Path::new(&old)).is_some());
        let next = f.file("next.md");
        c.write("main", "a", &next, "edited", true).unwrap();
        assert!(c.registry.owner_key(Path::new(&old)).is_none());
        assert_eq!(std::fs::read_to_string(next).unwrap(), "edited");
    }
    #[test]
    fn transfer_commits_once_and_lost_reply_cannot_restore_source_ownership() {
        let f = Fixture::new();
        let path = f.file("a.md");
        let mut c = coordinator();
        c.write("main", "a", &path, "saved", true).unwrap();
        let token = c
            .begin("main", "token".into(), snapshot("a", Some(&path)))
            .unwrap();
        assert!(c.release("main", "a").is_err());
        assert!(c.write("main", "a", &path, "conflict", false).is_err());
        assert!(c.idle("main").is_err());
        assert!(c.idle("editor-1").is_err());
        assert!(c.status("other", &token, false, true).is_err());
        assert!(c.status("main", &token, false, true).is_err());
        assert_eq!(
            c.status("editor-1", &token, false, true).unwrap()["status"],
            "committed"
        );
        assert_eq!(
            c.status("editor-1", &token, false, true).unwrap()["status"],
            "committed"
        );
        assert_eq!(
            c.status("main", &token, true, false).unwrap()["status"],
            "committed"
        );
        assert_eq!(
            c.registry.owner_key(Path::new(&path)).unwrap().window_label,
            "editor-1"
        );
        assert!(c.release("main", "a").is_err());
    }
    #[test]
    fn cancellation_tombstone_blocks_a_late_creation_request() {
        let mut c = coordinator();
        assert_eq!(
            c.status("main", "late", true, false).unwrap()["status"],
            "canceled"
        );
        assert!(c.begin("main", "late".into(), snapshot("a", None)).is_err());
        assert!(c.status("other", "late", true, false).is_err());
    }
    #[test]
    fn destroyed_staged_target_rolls_back_and_stale_ack_fails_to_commit() {
        let f = Fixture::new();
        let path = f.file("a.md");
        let mut c = coordinator();
        c.write("main", "a", &path, "saved", true).unwrap();
        let token = c
            .begin("main", "one".into(), snapshot("a", Some(&path)))
            .unwrap();
        c.destroyed("editor-1");
        assert_eq!(
            c.status("editor-1", &token, false, true).unwrap()["status"],
            "canceled"
        );
        assert_eq!(
            c.registry.owner_key(Path::new(&path)).unwrap().window_label,
            "main"
        );
        c.write("main", "a", &path, "still editable", false)
            .unwrap();
        c.begin("main", "two".into(), snapshot("a", Some(&path)))
            .unwrap();
        assert_eq!(
            c.status("editor-1", &token, false, true).unwrap()["status"],
            "canceled"
        );
        assert!(c.status("editor-1", "two", false, true).is_err());
    }
    #[test]
    fn untitled_transfer_preserves_snapshot_and_tracks_owner() {
        let mut c = coordinator();
        let state = snapshot("a", None);
        c.begin("main", "one".into(), state.clone()).unwrap();
        assert_eq!(c.transfers["one"].snapshot, state);
        c.status("editor-1", "one", false, true).unwrap();
        assert_eq!(c.untitled["a"], "editor-1");
        assert!(c.begin("main", "two".into(), snapshot("a", None)).is_err());
    }
    #[test]
    fn launch_routes_to_one_owner_or_most_recent_editor_and_cleanup_releases_claims() {
        let f = Fixture::new();
        let path = f.file("a.md");
        let mut c = coordinator();
        c.write("main", "a", &path, "saved", true).unwrap();
        assert_eq!(c.queue_launch(path.clone()).unwrap(), "main");
        assert_eq!(c.queue_launch(f.file("new.md")).unwrap(), "other");
        assert_eq!(c.launches["main"].len(), 1);
        assert_eq!(c.launches["other"].len(), 1);
        c.destroyed("main");
        assert!(c.registry.owner_key(Path::new(&path)).is_none());
        assert_eq!(c.launches["other"].len(), 2);
    }
    #[test]
    fn history_migrates_once_and_clear_cannot_be_undone_by_stale_readers() {
        let f = Fixture::new();
        let file = f.0.join("recents.json");
        let mut c = coordinator();
        assert_eq!(
            c.history(&file, "get", None, Some(vec!["old.md".into()]))
                .unwrap()
                .paths,
            ["old.md"]
        );
        c.history(&file, "add", Some("new.md".into()), None)
            .unwrap();
        let cleared = c.history(&file, "clear", None, None).unwrap();
        assert!(cleared.paths.is_empty());
        let reread = c
            .history(&file, "get", None, Some(vec!["old.md".into()]))
            .unwrap();
        assert_eq!(reread.revision, cleared.revision);
        assert!(reread.paths.is_empty());
        let mut restarted = coordinator();
        assert!(restarted
            .history(&file, "get", None, Some(vec!["old.md".into()]))
            .unwrap()
            .paths
            .is_empty());
    }
    #[test]
    fn history_failure_does_not_publish_unpersisted_clear() {
        let f = Fixture::new();
        let file = f.0.join("history.json");
        let mut c = coordinator();
        let initial = c
            .history(&file, "get", None, Some(vec!["a.md".into()]))
            .unwrap();
        let invalid = file.join("not-a-directory.json");
        assert!(c.history(&invalid, "clear", None, None).is_err());
        assert_eq!(c.history.as_ref().unwrap().paths, initial.paths);
        assert_eq!(c.history.as_ref().unwrap().revision, initial.revision);
    }
    #[test]
    fn invalid_snapshot_is_rejected_before_acquiring_a_transfer() {
        let mut c = coordinator();
        let mut state = snapshot("a", None);
        state["view"]["selectionEnd"] = json!(999);
        assert!(c.begin("main", "bad".into(), state).is_err());
        assert!(c.transfers.is_empty());
        assert!(c.idle("main").is_ok());
        let mut state = snapshot("a", None);
        state["document"]["version"] = json!(2);
        assert!(c.begin("main", "bad2".into(), state).is_err());
    }
    #[test]
    fn release_uses_the_reserved_key_even_after_its_parent_is_renamed() {
        let f = Fixture::new();
        let directory = f.0.join("original");
        std::fs::create_dir(&directory).unwrap();
        let path = directory.join("a.md").to_string_lossy().into_owned();
        let mut c = coordinator();
        c.write("main", "a", &path, "saved", true).unwrap();
        std::fs::rename(&directory, f.0.join("moved")).unwrap();
        c.release("main", "a").unwrap();
        assert!(c.registry.owner_key(Path::new(&path)).is_none());
    }
    #[test]
    fn concurrent_opens_observe_one_shared_reservation() {
        use std::sync::{Arc, Barrier};
        let f = Fixture::new();
        let path = f.file("race.md");
        let shared = Arc::new(Mutex::new(coordinator()));
        let barrier = Arc::new(Barrier::new(2));
        let handles: Vec<_> = [("main", "a"), ("other", "b")]
            .into_iter()
            .map(|(window, id)| {
                let shared = shared.clone();
                let barrier = barrier.clone();
                let path = path.clone();
                std::thread::spawn(move || {
                    barrier.wait();
                    shared.lock().unwrap().claim(window, id, &path).unwrap()
                })
            })
            .collect();
        let results: Vec<_> = handles.into_iter().map(|h| h.join().unwrap()).collect();
        assert_eq!(results[0]["owner"], results[1]["owner"]);
        let mut c = shared.lock().unwrap();
        assert_eq!(c.documents.len(), 1);
        let owner = c.registry.owner_key(Path::new(&path)).unwrap();
        adopt(&mut c, &owner.document_id);
        assert_eq!(c.claim("other", "retry", &path).unwrap()["ready"], true);
    }
    #[test]
    fn simultaneous_save_as_has_one_winner_without_overwriting_it() {
        use std::sync::{Arc, Barrier};
        let f = Fixture::new();
        let path = f.file("race.md");
        let shared = Arc::new(Mutex::new(coordinator()));
        let barrier = Arc::new(Barrier::new(2));
        let handles: Vec<_> = [("main", "a", "A"), ("other", "b", "B")]
            .into_iter()
            .map(|(window, id, text)| {
                let shared = shared.clone();
                let barrier = barrier.clone();
                let path = path.clone();
                std::thread::spawn(move || {
                    barrier.wait();
                    (
                        id,
                        text,
                        shared.lock().unwrap().write(window, id, &path, text, true),
                    )
                })
            })
            .collect();
        let results: Vec<_> = handles.into_iter().map(|h| h.join().unwrap()).collect();
        assert_eq!(results.iter().filter(|(_, _, r)| r.is_ok()).count(), 1);
        let (id, text, _) = results.iter().find(|(_, _, r)| r.is_ok()).unwrap();
        assert_eq!(std::fs::read_to_string(&path).unwrap(), *text);
        assert_eq!(
            shared
                .lock()
                .unwrap()
                .registry
                .owner_key(Path::new(&path))
                .unwrap()
                .document_id,
            *id
        );
    }
    #[test]
    fn concurrent_open_and_save_as_respect_whichever_reservation_wins() {
        use std::sync::{Arc, Barrier};
        let f = Fixture::new();
        let path = f.file("race.md");
        std::fs::write(&path, "original").unwrap();
        let shared = Arc::new(Mutex::new(coordinator()));
        let barrier = Arc::new(Barrier::new(2));
        let reader = {
            let shared = shared.clone();
            let barrier = barrier.clone();
            let path = path.clone();
            std::thread::spawn(move || {
                barrier.wait();
                shared.lock().unwrap().claim("main", "read", &path).unwrap()
            })
        };
        let writer = {
            let shared = shared.clone();
            let barrier = barrier.clone();
            let path = path.clone();
            std::thread::spawn(move || {
                barrier.wait();
                shared
                    .lock()
                    .unwrap()
                    .write("other", "write", &path, "new", true)
            })
        };
        let claim = reader.join().unwrap();
        let written = writer.join().unwrap();
        if claim["owner"]["document_id"] == "read" {
            assert!(written.is_err());
            assert_eq!(std::fs::read_to_string(&path).unwrap(), "original");
        } else {
            assert!(written.is_ok());
            assert_eq!(claim["ready"], true);
            assert_eq!(std::fs::read_to_string(&path).unwrap(), "new");
        }
        assert_eq!(shared.lock().unwrap().documents.len(), 1);
    }
    #[test]
    fn cancellation_and_acknowledgement_race_share_one_terminal_outcome() {
        use std::sync::{Arc, Barrier};
        let f = Fixture::new();
        let path = f.file("race.md");
        let mut c = coordinator();
        c.write("main", "a", &path, "saved", true).unwrap();
        c.begin("main", "race".into(), snapshot("a", Some(&path)))
            .unwrap();
        let shared = Arc::new(Mutex::new(c));
        let barrier = Arc::new(Barrier::new(2));
        let handles: Vec<_> = [("main", true, false), ("editor-1", false, true)]
            .into_iter()
            .map(|(window, cancel, ack)| {
                let shared = shared.clone();
                let barrier = barrier.clone();
                std::thread::spawn(move || {
                    barrier.wait();
                    shared
                        .lock()
                        .unwrap()
                        .status(window, "race", cancel, ack)
                        .unwrap()
                })
            })
            .collect();
        let results: Vec<_> = handles.into_iter().map(|h| h.join().unwrap()).collect();
        assert_eq!(results[0]["status"], results[1]["status"]);
        let c = shared.lock().unwrap();
        let owner = if results[0]["status"] == "committed" {
            "editor-1"
        } else {
            "main"
        };
        assert_eq!(
            c.registry.owner_key(Path::new(&path)).unwrap().window_label,
            owner
        );
        assert!(c.transfers["race"].snapshot.is_null());
    }
    #[test]
    fn reloaded_destination_does_not_replay_committed_content_or_retain_old_claims() {
        let f = Fixture::new();
        let path = f.file("a.md");
        let mut c = coordinator();
        c.write("main", "a", &path, "saved", true).unwrap();
        let state = snapshot("a", Some(&path));
        c.begin("main", "one".into(), state.clone()).unwrap();
        assert_eq!(c.stage("editor-1")["snapshot"], state);
        c.status("editor-1", "one", false, true).unwrap();
        c.editors.push("editor-1".into());
        assert!(c.stage("editor-1").is_null());
        assert!(c.registry.owner_key(Path::new(&path)).is_none());
        // The source still reconciles the historical commit, never reviving the moved tab.
        assert_eq!(
            c.status("main", "one", true, false).unwrap()["status"],
            "committed"
        );
        assert_eq!(
            c.claim("other", "new", &path).unwrap()["owner"]["document_id"],
            "new"
        );
    }
}
