"use client"

import { useState } from "react"
import { Trash2, FileAudio, FileVideo, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteMediaItem, type MediaItem } from "@/lib/api"
import { useMediaBlob } from "@/hooks/useMediaBlob"

// ── Single media item card ────────────────────────────────────────────────────
function MediaCard({
  item,
  type,
  onDelete,
  getToken,
}: {
  item: MediaItem
  type: "audio" | "video"
  onDelete: (id: string) => void
  getToken: () => Promise<string | null>
}) {
  const { blobUrl, loading, error } = useMediaBlob(item.id, getToken)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const uploadedAt = new Date(item.created_at).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const fileSizeLabel = item.size_bytes
    ? item.size_bytes > 1024 * 1024
      ? `${(item.size_bytes / 1024 / 1024).toFixed(1)} MB`
      : `${(item.size_bytes / 1024).toFixed(0)} KB`
    : null

  const handleConfirmDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteMediaItem(item.id, getToken)
      onDelete(item.id)
    } catch (err: any) {
      setDeleteError(err.message || "Delete failed")
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        {/* File info row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
              {type === "audio" ? (
                <FileAudio className="h-4 w-4 text-primary" />
              ) : (
                <FileVideo className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{item.filename}</p>
              <p className="text-xs text-white/40 mt-0.5">
                Uploaded {uploadedAt}
                {fileSizeLabel ? ` · ${fileSizeLabel}` : ""}
                {item.language ? ` · ${item.language.charAt(0).toUpperCase() + item.language.slice(1)}` : ""}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowConfirm(true)}
            disabled={deleting}
            className="shrink-0 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Preview */}
        {loading && (
          <div className="flex items-center gap-2 text-white/40 text-xs py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading preview...
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400/60 text-xs py-1">
            <AlertCircle className="h-3 w-3" />
            Preview unavailable
          </div>
        )}
        {blobUrl && type === "audio" && (
          <audio controls src={blobUrl} className="w-full h-10" />
        )}
        {blobUrl && type === "video" && (
          <video controls src={blobUrl} className="w-full rounded-lg max-h-48 bg-black" />
        )}

        {/* Inline delete error */}
        {deleteError && (
          <p className="text-xs text-red-400">{deleteError}</p>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-black/95 border border-white/10 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this file?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              <strong className="text-white/80">{item.filename}</strong> will be permanently deleted
              from the server. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700 border-0"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-white/10" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-white/10 rounded w-2/3" />
          <div className="h-2.5 bg-white/10 rounded w-1/3" />
        </div>
      </div>
      <div className="h-8 bg-white/10 rounded" />
    </div>
  )
}

// ── MediaList (exported) ──────────────────────────────────────────────────────
interface MediaListProps {
  items: MediaItem[]
  type: "audio" | "video"
  onDelete: (id: string) => void
  isLoading: boolean
  label?: string
  getToken: () => Promise<string | null>
}

export function MediaList({ items, type, onDelete, isLoading, label, getToken }: MediaListProps) {
  return (
    <div className="space-y-3">
      {label && (
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">{label}</h3>
      )}

      {isLoading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-white/30 border border-dashed border-white/10 rounded-xl">
          {type === "audio" ? (
            <FileAudio className="h-8 w-8" />
          ) : (
            <FileVideo className="h-8 w-8" />
          )}
          <p className="text-sm">No samples uploaded yet</p>
        </div>
      )}

      {!isLoading &&
        items.map((item) => (
          <MediaCard key={item.id} item={item} type={type} onDelete={onDelete} getToken={getToken} />
        ))}
    </div>
  )
}
