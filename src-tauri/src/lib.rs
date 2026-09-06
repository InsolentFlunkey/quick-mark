pub mod document_registry;
mod editor_coordinator;
use percent_encoding::percent_decode_str;
use std::ffi::OsString;
use std::fs::OpenOptions;
use std::path::{Path, PathBuf};
use tauri::Manager;

#[cfg(desktop)]
mod window_geometry;

const MAX_LOCAL_IMAGE_BYTES: u64 = 10 * 1024 * 1024;

#[derive(Debug, serde::Serialize)]
struct LocalImageData {
    bytes: Vec<u8>,
    mime: &'static str,
}

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

fn has_uri_scheme(reference: &str) -> bool {
    let Some(colon) = reference.find(':') else {
        return false;
    };
    let prefix = &reference[..colon];
    !prefix.is_empty()
        && prefix
            .chars()
            .next()
            .is_some_and(|character| character.is_ascii_alphabetic())
        && prefix.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '+' | '-' | '.')
        })
}

fn resolve_relative_resource(document_path: &Path, reference: &str) -> Result<PathBuf, String> {
    validate_document_path(document_path)?;
    if !document_path.is_file() {
        return Err("The active document path is missing or inaccessible".to_string());
    }
    let reference = reference.trim();
    if reference.is_empty() {
        return Err("The resource reference is empty".to_string());
    }
    let path_part = reference.split(['?', '#']).next().unwrap_or_default();
    let decoded = percent_decode_str(path_part)
        .decode_utf8()
        .map_err(|_| "The resource reference is not valid UTF-8".to_string())?;
    if decoded.is_empty() || has_uri_scheme(&decoded) {
        return Err("Only relative filesystem references are supported".to_string());
    }
    let reference_path = Path::new(decoded.as_ref());
    if reference_path.is_absolute()
        || decoded.starts_with("//")
        || decoded.starts_with("\\\\")
        || (decoded.len() >= 3
            && decoded.as_bytes()[0].is_ascii_alphabetic()
            && decoded.as_bytes()[1] == b':'
            && matches!(decoded.as_bytes()[2], b'/' | b'\\'))
    {
        return Err("Absolute filesystem references are not supported".to_string());
    }
    let parent = document_path
        .parent()
        .ok_or_else(|| "The active document has no parent directory".to_string())?;
    let target = parent.join(reference_path);
    let canonical = target
        .canonicalize()
        .map_err(|error| format!("Could not resolve {}: {error}", target.display()))?;
    if !canonical.is_file() {
        return Err(format!("{} is not a file", canonical.display()));
    }
    Ok(canonical)
}

#[tauri::command]
fn canonical_document_path(path: String) -> Result<String, String> {
    document_registry::canonical_document_path(Path::new(&path))
        .map(|path| path.to_string_lossy().into_owned())
}

#[tauri::command]
fn resolve_document_link(document_path: String, reference: String) -> Result<String, String> {
    let path = resolve_relative_resource(Path::new(&document_path), &reference)?;
    validate_document_path(&path)?;
    Ok(path.to_string_lossy().into_owned())
}

fn image_mime(path: &Path) -> Option<&'static str> {
    match path.extension()?.to_str()?.to_ascii_lowercase().as_str() {
        "png" => Some("image/png"),
        "jpg" | "jpeg" => Some("image/jpeg"),
        "gif" => Some("image/gif"),
        "webp" => Some("image/webp"),
        "bmp" => Some("image/bmp"),
        _ => None,
    }
}

#[tauri::command]
fn read_local_image(document_path: String, reference: String) -> Result<LocalImageData, String> {
    let path = resolve_relative_resource(Path::new(&document_path), &reference)?;
    let mime = image_mime(&path).ok_or_else(|| {
        "QuickMark supports local PNG, JPEG, GIF, WebP, and BMP images".to_string()
    })?;
    let metadata = std::fs::metadata(&path)
        .map_err(|error| format!("Could not inspect {}: {error}", path.display()))?;
    if metadata.len() > MAX_LOCAL_IMAGE_BYTES {
        return Err("Local images must be 10 MiB or smaller".to_string());
    }
    let bytes = std::fs::read(&path)
        .map_err(|error| format!("Could not read {}: {error}", path.display()))?;
    Ok(LocalImageData { bytes, mime })
}

#[tauri::command]
fn read_document(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    validate_document_path(&path)?;
    std::fs::read_to_string(&path)
        .map_err(|error| format!("Could not read {}: {error}", path.display()))
}

fn write_document_file(path: String, content: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    validate_document_path(&path)?;
    std::fs::write(&path, content)
        .map_err(|error| format!("Could not write {}: {error}", path.display()))
}

#[tauri::command]
fn document_writable(path: String) -> Result<bool, String> {
    let path = PathBuf::from(path);
    validate_document_path(&path)?;
    let metadata = std::fs::metadata(&path)
        .map_err(|error| format!("Could not inspect {}: {error}", path.display()))?;
    if !metadata.is_file() {
        return Err(format!("{} is not a file", path.display()));
    }
    if metadata.permissions().readonly() {
        return Ok(false);
    }
    match OpenOptions::new().write(true).open(&path) {
        Ok(_) => Ok(true),
        Err(error) if error.kind() == std::io::ErrorKind::PermissionDenied => Ok(false),
        Err(error) => Err(format!("Could not inspect {}: {error}", path.display())),
    }
}

#[tauri::command]
fn initial_launch_path() -> Option<String> {
    let current_directory = std::env::current_dir().ok()?;
    resolve_launch_path(std::env::args_os(), &current_directory)
        .map(|path| path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default().plugin(tauri_plugin_opener::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(window_geometry::sanitizer_plugin());
        builder = builder.plugin(
            tauri_plugin_window_state::Builder::new()
                .with_filter(|label| !label.starts_with("editor-"))
                .build(),
        );
        builder = builder.plugin(window_geometry::bounds_plugin());
        builder = builder.plugin(tauri_plugin_single_instance::init(
            |app, arguments, current_directory| {
                let arguments = arguments.into_iter().map(OsString::from);
                if let Some(path) = resolve_launch_path(arguments, Path::new(&current_directory)) {
                    editor_coordinator::launch(app, path.to_string_lossy().into_owned());
                }
            },
        ));
    }

    builder
        .manage(editor_coordinator::SharedCoordinator::default())
        .on_window_event(editor_coordinator::on_window_event)
        .setup(|app| {
            if let Some(path) = initial_launch_path() {
                app.state::<editor_coordinator::SharedCoordinator>()
                    .lock()
                    .unwrap()
                    .initial_launch(path);
            }
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_document,
            editor_coordinator::editor_command,
            editor_coordinator::write_document,
            document_writable,
            canonical_document_path,
            resolve_document_link,
            read_local_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running QuickMark");
}

#[cfg(test)]
mod tests {
    use super::{
        document_writable, image_mime, is_supported_document, read_document, read_local_image,
        resolve_document_link, resolve_launch_path, resolve_relative_resource,
        write_document_file as write_document,
    };
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

    #[test]
    fn reports_writable_and_read_only_documents_without_modifying_content() {
        let directory = temporary_directory("writability");
        let path = directory.join("notes.md");
        fs::write(&path, "unchanged").expect("write fixture");
        let path_string = path.to_string_lossy().into_owned();
        assert!(document_writable(path_string.clone()).expect("inspect writable file"));

        let mut permissions = fs::metadata(&path).expect("metadata").permissions();
        permissions.set_readonly(true);
        fs::set_permissions(&path, permissions).expect("set read-only");
        assert!(!document_writable(path_string).expect("inspect read-only file"));
        assert_eq!(
            fs::read_to_string(&path).expect("read fixture"),
            "unchanged"
        );

        let mut permissions = fs::metadata(&path).expect("metadata").permissions();
        permissions.set_readonly(false);
        fs::set_permissions(&path, permissions).expect("restore permissions");
        fs::remove_dir_all(directory).expect("remove fixture");
    }

    #[test]
    fn resolves_relative_document_links_with_native_path_semantics() {
        let directory = temporary_directory("relative-links");
        let documents = directory.join("documents");
        let shared = directory.join("shared");
        fs::create_dir_all(&documents).expect("create documents");
        fs::create_dir_all(&shared).expect("create shared");
        let active = documents.join("active.md");
        let target = shared.join("target.markdown");
        fs::write(&active, "[target](../shared/target.markdown)").expect("write active document");
        fs::write(&target, "# Target").expect("write target document");

        let resolved = resolve_document_link(
            active.to_string_lossy().into_owned(),
            "../shared/target.markdown".to_string(),
        )
        .expect("resolve document link");
        assert_eq!(
            PathBuf::from(resolved),
            target.canonicalize().expect("canonical target")
        );
        assert!(resolve_relative_resource(&active, "https://example.com").is_err());
        assert!(resolve_relative_resource(&active, target.to_string_lossy().as_ref()).is_err());
        assert!(resolve_document_link(
            active.to_string_lossy().into_owned(),
            "missing.md".to_string()
        )
        .expect_err("missing target")
        .contains("Could not resolve"));
        fs::remove_dir_all(directory).expect("remove relative link fixture");
    }

    #[test]
    fn reads_only_supported_local_raster_images() {
        let directory = temporary_directory("local-images");
        let active = directory.join("active.md");
        let image = directory.join("image.png");
        let unsupported = directory.join("image.svg");
        fs::write(&active, "![image](image.png)").expect("write active document");
        fs::write(&image, [1_u8, 2, 3, 4]).expect("write image");
        fs::write(&unsupported, "<svg></svg>").expect("write unsupported image");

        let result = read_local_image(
            active.to_string_lossy().into_owned(),
            "image.png".to_string(),
        )
        .expect("read local image");
        assert_eq!(result.bytes, vec![1, 2, 3, 4]);
        assert_eq!(result.mime, "image/png");
        assert_eq!(image_mime(Path::new("photo.JPEG")), Some("image/jpeg"));
        assert!(read_local_image(
            active.to_string_lossy().into_owned(),
            "image.svg".to_string()
        )
        .expect_err("reject SVG")
        .contains("PNG, JPEG, GIF, WebP, and BMP"));
        fs::remove_dir_all(directory).expect("remove local image fixture");
    }

    #[test]
    fn rejects_oversized_local_images() {
        let directory = temporary_directory("oversized-image");
        let active = directory.join("active.md");
        let image = directory.join("large.png");
        fs::write(&active, "![large](large.png)").expect("write active document");
        let file = fs::File::create(&image).expect("create large image");
        file.set_len(super::MAX_LOCAL_IMAGE_BYTES + 1)
            .expect("size large image");

        assert!(read_local_image(
            active.to_string_lossy().into_owned(),
            "large.png".to_string()
        )
        .expect_err("reject oversized image")
        .contains("10 MiB"));
        fs::remove_dir_all(directory).expect("remove oversized image fixture");
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
