-- Optional link column for posts (event page, menu, signup form, etc.)
-- Run on existing schema:
ALTER TABLE posts ADD COLUMN IF NOT EXISTS link TEXT;
