# Release verification

[README](../README.md)

Build a release using [Building on Windows](build-windows.md) or [Building on Linux](build-linux.md) before these checks.

## Windows release smoke test

After building, run the generated installer and launch QuickMark from the Start menu. Use disposable documents for these checks:

1. Choose **File → Open** and open a `.md` file in a folder whose name contains a space. Confirm the Markdown Input pane and Preview show the document.
2. Edit the Markdown Input pane, choose **File → Save**, close the tab with its **×** button, and reopen the file using **File → Open**. Confirm the edit persisted.
3. Choose **File → Save As**, save a separate `.markdown` copy, and confirm the tab shows the new filename and the original file still exists.
4. Choose **View → Preview**, then **View → Split**. Confirm the visible panes change without losing content.
5. Open **Help → README** and **Help → Markdown Cheat Sheet**. Confirm each opens a read-only reference window and the editor remains usable. Close those reference windows separately.
6. Close QuickMark and use Windows **Open with** on the saved copy to launch it with QuickMark. Confirm the requested document opens. Tabs and unsaved contents deliberately do not survive a restart.

## Bundled documentation on Windows and Linux

1. Launch the packaged app (on Linux, install the RPM and launch QuickMark from the desktop menu). Type a disposable unsaved sentence in **Markdown Input**.
2. Choose **Help → README**. Confirm the overview describes app features and offers guides.
3. Follow **Editing and managing documents**, then **Markdown linting**. Confirm both display in the same read-only window and the editor sentence remains intact.
4. Choose **Back**. Confirm you return to Editing and managing documents at the position where you followed its linting link. Choose **Back** again to return to the overview at its previous position. Follow the **README** link from a guide to confirm it always opens the overview. Visit each remaining guide. Confirm the build guides include commands and artifact locations, and Markdown support has a readable table. Repeat guide navigation while offline; bundled text must remain available.
5. From a guide, use the keyboard to focus **Back** and press **Enter**. Confirm the previous document and reading position return, with focus in the restored reading region. Close the reference window, reopen **Help → README**, and confirm it starts at the overview with **Back** disabled.
6. Open **Help → Markdown Cheat Sheet** and **Help → Markdown Examples**. Confirm the cheat sheet is read-only and Examples remains editable with **Reset** and **Save As**.

## GitHub documentation

Open README in a GitHub-style Markdown preview. Check the feature overview, follow every guide link and its return link, and inspect the commands and Markdown support table for readable formatting. External prerequisite links open separately from the offline guide content.
