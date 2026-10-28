# Uploads Directory

This directory stores customer-uploaded artwork, photos for custom frame orders, and temporary upload attachments when running on local storage mode.

* Customer files uploaded via `/api/upload` are processed by Multer and stored here locally or uploaded to Supabase Storage bucket `photos`.
* Kept in version control with `.gitkeep` while user uploads remain ignored via `.gitignore`.
