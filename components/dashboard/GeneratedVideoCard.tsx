"use client"

import { useState } from "react"
import Link from "next/link"
import { Clapperboard, Loader2, AlertCircle, Play, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { LipSyncOutputItem } from "@/lib/api"
import { deleteLipSyncOutput } from "@/lib/api"
import { useLipSyncOutputBlob } from "@/hooks/useLipSyncOutputBlob"
import { toast } from "sonner"

function shortJobLabel(jobId: string) {
  const s = jobId.replace(/^lipsync_/, "")
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-6)}` : s
}

interface GeneratedVideoCardProps {
  item: LipSyncOutputItem
  getToken: () => Promise<string | null>
  /** Smaller preview height on dashboard grid */
  compact?: boolean
  /** Show “Open in My videos” (useful on dashboard; hide on My videos page) */
  showOpenInLibraryLink?: boolean
  /** Show delete (generated file on disk). Default true. */
  showDelete?: boolean
  /** Called after successful delete so parent can refresh the list */
  onDeleted?: () => void
}

export function GeneratedVideoCard({
  item,
  getToken,
  compact,
  showOpenInLibraryLink,
  showDelete = true,
  onDeleted,
}: GeneratedVideoCardProps) {
  const { blobUrl, loading, error } = useLipSyncOutputBlob(item.jobId, getToken)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const formattedDate = new Date(item.created_at).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const sizeLabel =
    item.size_bytes > 1024 * 1024
      ? `${(item.size_bytes / 1024 / 1024).toFixed(1)} MB`
      : `${(item.size_bytes / 1024).toFixed(0)} KB`

  const maxH = compact ? "max-h-40" : "max-h-56"

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteLipSyncOutput(item.jobId, getToken)
      toast.success("Video deleted")
      setConfirmOpen(false)
      onDeleted?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete video")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 h-full min-h-0 relative">
        {showDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-500/10 z-10"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            aria-label="Delete video"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        <div className="flex items-start gap-3 min-w-0 pr-8">
          <div className="p-2 rounded-lg bg-primary/15 border border-primary/25 shrink-0">
            <Clapperboard className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-white">Lip-sync output</p>
            <p className="text-xs text-white/70">{formattedDate}</p>
            <p className="text-xs text-white/45">
              {sizeLabel}
              <span className="text-white/25"> · </span>
              <span className="font-mono text-white/50" title={item.jobId}>
                {shortJobLabel(item.jobId)}
              </span>
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-white/40 text-xs py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading preview…
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400/70 text-xs">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </div>
        )}
        {blobUrl && (
          <video
            controls
            src={blobUrl}
            className={`w-full rounded-lg ${maxH} bg-black object-contain`}
            playsInline
            preload="metadata"
          />
        )}

        {showOpenInLibraryLink ? (
          <div className="pt-1 mt-auto border-t border-white/10 shrink-0">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary hover:bg-primary/10 px-0 h-auto font-medium"
            >
              <Link href="/dashboard/my-videos" className="inline-flex items-center gap-1.5">
                <Play className="h-3.5 w-3.5" />
                Open in My videos
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-black/95 border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This removes the generated file from storage. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
