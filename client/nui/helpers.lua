------------------------------------
-- EasyAdmin NUI: shared helpers
-- Common utility functions for NUI callbacks
------------------------------------

---Send a toast notification to the NUI frontend.
---@param text string
---@param kind? string  "success" | "error" | "warning" | "info"
function toast(text, kind)
  SendNUIMessage({
    action = 'notification',
    data = { text = text, type = kind or 'success' },
  })
end

---Return a permission-denied error to the NUI callback.
---@param cb function
---@param msg? string
function deny(cb, msg)
  cb({ error = msg or 'Permission denied' })
end
