"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UndoButtonProps {
  onUndo: () => Promise<void>
  disabled?: boolean
}

export function UndoButton({ onUndo, disabled }: UndoButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleUndo = async () => {
    setIsLoading(true)
    try {
      await onUndo()
      setShowConfirm(false)
    } catch (error) {
      console.error("Undo error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setShowConfirm(true)} disabled={disabled}>
        Undo Last Point
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo Last Point?</DialogTitle>
            <DialogDescription>
              This will remove the last point scored. This action preserves the rally history but
              marks it as deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleUndo} disabled={isLoading}>
              {isLoading ? "Undoing..." : "Confirm Undo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
