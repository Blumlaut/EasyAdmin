# Player UI: Action History + Admin Notes

## Goal
Integrate **Action History** and **Admin Notes** into the rewritten player UI.

## Scope
- Add both features to the **player detail UI**
- Reuse existing backend events/permissions
- Assume **offline/cached player support is already in place**

## Plan
1. **Add typed frontend models**
   - Define action history and admin notes entry types
   - Include IDs, timestamps, moderator info, reason/content, and optional ban linkage

2. **Add NUI bridge handlers**
   - Request action history for a selected player
   - Request admin notes for a selected player
   - Add/delete admin note actions
   - Delete action history entry action

3. **Wire incoming client events into React state**
   - Forward `EasyAdmin:ReceiveActionHistory`
   - Forward `EasyAdmin:ReceiveAdminNotes`
   - Store per-selected-player data cleanly

4. **Integrate into player detail page**
   - Add Action History section/tab
   - Add Admin Notes section/tab
   - Show loading, empty, and error states

5. **Respect permissions in UI**
   - View-only users can read data
   - Hide/disable add/delete controls without permission
   - Keep destructive actions behind confirmation UI

6. **Polish UX**
   - Copy moderator/user identifiers where useful
   - Link ban-related actions to existing ban detail flow where possible
   - Keep layout consistent with current player detail design

## Manual testing
- Open an online player and load both sections
- Open an offline/cached player and verify both sections still load
- Add/delete an admin note
- Delete an action history entry
- Verify permission-gated controls appear/disappear correctly
- Verify ban-linked actions behave correctly
