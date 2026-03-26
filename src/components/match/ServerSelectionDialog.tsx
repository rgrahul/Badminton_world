"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ServerSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchType: "SINGLES" | "DOUBLES"
  sideAPlayer1: string
  sideAPlayer2?: string | null
  sideBPlayer1: string
  sideBPlayer2?: string | null
  onSelectServer: (servingSide: "A" | "B", serverName: string) => void
}

export function ServerSelectionDialog({
  open,
  onOpenChange,
  matchType,
  sideAPlayer1,
  sideAPlayer2,
  sideBPlayer1,
  sideBPlayer2,
  onSelectServer,
}: ServerSelectionDialogProps) {
  const handleSelect = (servingSide: "A" | "B", serverName: string) => {
    onSelectServer(servingSide, serverName)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Initial Server</DialogTitle>
          <DialogDescription>
            Choose who will serve first in this match
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Team A Players */}
          <div>
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Team A</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 px-6"
                onClick={() => handleSelect("A", sideAPlayer1)}
              >
                <div className="text-left">
                  <div className="font-medium text-base">{sideAPlayer1}</div>
                  <div className="text-sm text-muted-foreground">Team A - Player 1</div>
                </div>
              </Button>
              {matchType === "DOUBLES" && sideAPlayer2 && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4 px-6"
                  onClick={() => handleSelect("A", sideAPlayer2)}
                >
                  <div className="text-left">
                    <div className="font-medium text-base">{sideAPlayer2}</div>
                    <div className="text-sm text-muted-foreground">Team A - Player 2</div>
                  </div>
                </Button>
              )}
            </div>
          </div>

          {/* Team B Players */}
          <div>
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Team B</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 px-6"
                onClick={() => handleSelect("B", sideBPlayer1)}
              >
                <div className="text-left">
                  <div className="font-medium text-base">{sideBPlayer1}</div>
                  <div className="text-sm text-muted-foreground">Team B - Player 1</div>
                </div>
              </Button>
              {matchType === "DOUBLES" && sideBPlayer2 && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4 px-6"
                  onClick={() => handleSelect("B", sideBPlayer2)}
                >
                  <div className="text-left">
                    <div className="font-medium text-base">{sideBPlayer2}</div>
                    <div className="text-sm text-muted-foreground">Team B - Player 2</div>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
