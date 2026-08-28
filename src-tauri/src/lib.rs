use std::ffi::OsString;
use std::path::{Path, PathBuf};
use tauri::{Emitter, Manager};

const OPEN_FILE_EVENT: &str = "quickmark://open-file";

fn is_supported_document(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            matches!(
                extension.to_ascii_lowercase().as_str(),
                "md" | "markdown" | "txt"
            )
        })
}

fn resolve_launch_path<I>(arguments: I, current_directory: &Path) -> Option<PathBuf>
where
    I: IntoIterator<Item = OsString>,
{
    arguments.into_iter().skip(1).find_map(|argument| {
        let path = PathBuf::from(argument);
        let absolute_path = if path.is_absolute() {
            path
        } else {
            current_directory.join(path)
        };
        (is_supported_document(&absolute_path) && absolute_path.is_file()).then_some(absolute_path)
    })
}

fn validate_document_path(path: &Path) -> Result<(), String> {
    if is_supported_document(path) {
        Ok(())
    } else {
        Err("QuickMark supports .md, .markdown, and .txt files".to_string())
    }
}

#[tauri::command]
fn read_document(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    validate_document_path(&path)?;
    std::fs::read_to_string(&path)
        .map_err(|error| format!("Could not read {}: {error}", path.display()))
}

#[tauri::command]
fn write_document(path: String, content: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    validate_document_path(&path)?;
    std::fs::write(&path, content)
        .map_err(|error| format!("Could not write {}: {error}", path.display()))
}

#[tauri::command]
fn initial_launch_path() -> Option<String> {
    let current_directory = std::env::current_dir().ok()?;
    resolve_launch_path(std::env::args_os(), &current_directory)
        .map(|path| path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(
            |app, arguments, current_directory| {
                let arguments = arguments.into_iter().map(OsString::from);
                if let Some(path) = resolve_launch_path(arguments, Path::new(&current_directory)) {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                    let _ = app.emit(OPEN_FILE_EVENT, path.to_string_lossy().into_owned());
                }
            },
        ));
    }

    builder
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_document,
            write_document,
            initial_launch_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running QuickMark");
}

#[cfg(test)]
mod tests {
    use super::{is_supported_document, read_document, resolve_launch_path, write_document};
    use std::ffi::OsString;
    use std::fs;
    use std::path::{Path, PathBuf};

    #[test]
    fn recognizes_supported_document_extensions_case_insensitively() {
        for path in ["notes.md", "notes.MARKDOWN", "notes.Txt"] {
            assert!(is_supported_document(Path::new(path)), "{path}");
        }
        for path in ["notes", "notes.html", "notes.md.exe"] {
            assert!(!is_supported_document(Path::new(path)), "{path}");
        }
    }

    #[test]
    fn resolves_the_first_existing_supported_launch_argument() {
        let directory = temporary_directory("launch");
        let markdown_path = directory.join("opened.md");
        fs::write(&markdown_path, "# Opened").expect("write launch fixture");
        let arguments = [
            OsString::from("quick-mark"),
            OsString::from("--ignored"),
            OsString::from("opened.md"),
        ];

        assert_eq!(
            resolve_launch_path(arguments, &directory),
            Some(markdown_path)
        );
        fs::remove_dir_all(directory).expect("remove launch fixture");
    }

    #[test]
    fn ignores_missing_and_unsupported_launch_arguments() {
        let directory = temporary_directory("ignored");
        let unsupported_path = directory.join("notes.html");
        fs::write(&unsupported_path, "not Markdown").expect("write unsupported fixture");
        let arguments = [
            OsString::from("quick-mark"),
            unsupported_path.into_os_string(),
            OsString::from("missing.md"),
        ];

        assert_eq!(resolve_launch_path(arguments, &directory), None);
        fs::remove_dir_all(directory).expect("remove unsupported fixture");
    }

    #[test]
    fn reads_and_writes_supported_utf8_documents() {
        let directory = temporary_directory("file-commands");
        let path = directory.join("notes.md");
        let path_string = path.to_string_lossy().into_owned();

        write_document(path_string.clone(), "# Saved\n".to_string()).expect("write document");
        assert_eq!(
            read_document(path_string).expect("read document"),
            "# Saved\n"
        );
        fs::remove_dir_all(directory).expect("remove file command fixture");
    }

    #[test]
    fn rejects_unsupported_paths_before_file_access() {
        let directory = temporary_directory("rejected-command");
        let path = directory.join("notes.html").to_string_lossy().into_owned();

        assert!(read_document(path.clone())
            .expect_err("reject read")
            .contains("supports"));
        assert!(write_document(path, "content".to_string())
            .expect_err("reject write")
            .contains("supports"));
        fs::remove_dir_all(directory).expect("remove rejected command fixture");
    }

    fn temporary_directory(label: &str) -> PathBuf {
        let directory = std::env::temp_dir().join(format!(
            "quick-mark-{label}-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system time")
                .as_nanos()
        ));
        fs::create_dir_all(&directory).expect("create temporary directory");
        directory
    }
}
