# Title Field Implementation Guide

## Overview
Added a `title` field to the script generation and refinement workflow to help users identify their content in the dashboard. Previously, the dashboard displayed vague content excerpts; now users can provide meaningful titles when creating content.

## Changes Made

### 1. Frontend Changes

#### `lib/api.ts`
- Added `title: string` to `ScriptGenerationParams` interface
- Added `title: string` to `ScriptRefinementParams` interface

#### `components/create-content/ScriptGeneration.tsx`
- Added `title` state variable
- Added title input field as the first field in the form
- Updated validation to require title
- Updated params object to include title when calling API

#### `components/create-content/ScriptRefinement.tsx`
- Added `title` state variable
- Added title input field as the first field in the form
- Updated validation to require title
- Updated params object to include title when calling API
- Added `Input` component import

#### `app/dashboard/page.tsx`
- Added `title: string` to `Draft` interface
- Updated draft card display to show `draft.title` instead of content excerpt
- Kept fallback to `getTitleFromContent()` for backwards compatibility

### 2. Backend Changes

#### `server/src/prompts/scriptGeneration.ts`
- Added `title: string` to `ScriptGenerationParams` interface

#### `server/src/controllers/contentController.ts`
- **generateScript**: Added title to request validation and database insert
- **refineScript**: Added title to request validation and database insert

### 3. Database Changes

#### `server/CREATE_SCRIPTS_TABLE.sql`
- Updated table schema to include `title TEXT NOT NULL` column
- Added inline comment for documentation

#### `server/ADD_TITLE_COLUMN_MIGRATION.sql` (NEW FILE)
- Migration script to add title column to existing tables
- Updates existing records with default titles from content
- Makes column NOT NULL after setting defaults

## Migration Steps

### For New Installations
If you're setting up the database for the first time:
1. Run `server/CREATE_SCRIPTS_TABLE.sql` in your Supabase SQL Editor
   - This already includes the title column

### For Existing Installations
If you already have the scripts table:
1. Run `server/ADD_TITLE_COLUMN_MIGRATION.sql` in your Supabase SQL Editor
   - This will add the title column
   - Populate existing records with default titles
   - Set the column as NOT NULL

```sql
-- Execute this in Supabase SQL Editor
-- Copy and paste from server/ADD_TITLE_COLUMN_MIGRATION.sql
```

## User Impact

### Before
- Dashboard showed truncated content: "How to create engaging short-form..."
- Users couldn't easily identify their drafts
- Had to read content excerpt to remember what the script was about

### After
- Users provide a meaningful title: "Social Media Marketing Tutorial"
- Dashboard displays the title prominently
- Easy identification of content at a glance
- Title is required field (with helpful placeholder and description)

## Field Details

- **Field Name**: `title`
- **Type**: `string` (TEXT in database)
- **Required**: Yes
- **Validation**: Must not be empty/whitespace
- **Max Length**: No specific limit (reasonable titles expected)
- **Placeholder Examples**: 
  - "Social Media Marketing Tutorial"
  - "Refined Marketing Script"
  - "How to Create Engaging Videos"
- **Database**: Stored in `scripts` table alongside other metadata
- **Display**: Shown in dashboard draft cards

## API Changes

### POST `/api/content/generate-script`
**New Required Field**: `title`

```json
{
  "title": "My Content Title",
  "language": "English",
  "topic": "...",
  // ... other fields
}
```

### POST `/api/content/refine-script`
**New Required Field**: `title`

```json
{
  "title": "Refined Script Title",
  "originalScript": "...",
  "refinementType": "simple",
  // ... other fields
}
```

### POST `/api/content/refine-with-feedback`
**No changes** - Uses existing scriptId, title not needed

## Testing Checklist

- [ ] Run database migration in Supabase
- [ ] Test script generation with title
- [ ] Test script refinement with title
- [ ] Verify title appears in dashboard
- [ ] Check validation works (empty title rejected)
- [ ] Verify existing drafts still display (fallback working)
- [ ] Test backend server starts without errors
- [ ] Confirm TypeScript compilation succeeds

## Rollback Plan

If issues arise, you can rollback:

```sql
-- Remove title column (WARNING: This will delete title data)
ALTER TABLE public.scripts
DROP COLUMN IF EXISTS title;
```

Then revert the code changes by checking out the previous commit.

## Notes

- Title is stored in the `scripts` table, not in the `parameters` JSONB field
- Backwards compatibility maintained with fallback in dashboard
- No changes needed to feedback refinement (updates existing script)
- Title helps with content organization and identification
- Consider adding title edit functionality in future iterations
