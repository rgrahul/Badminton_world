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

type TossWinner = "A" | "B"
type TossChoice = "SERVE" | "SIDE"
type CourtSide = "LEFT" | "RIGHT"

interface TossResult {
  tossWonBy: "A" | "B"
  tossChoice: "SERVE" | "SIDE"
  servingSide: "A" | "B"
  serverName: string
  receiverName?: string
  courtSwapped: boolean
}

interface TossDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchType: "SINGLES" | "DOUBLES"
  sideAPlayer1: string
  sideAPlayer2?: string | null
  sideBPlayer1: string
  sideBPlayer2?: string | null
  onComplete: (result: TossResult) => void
}

type Step = "TOSS_WINNER" | "WINNER_CHOICE" | "COURT_SIDE" | "SERVER_PICK" | "RECEIVER_PICK"

export function TossDialog({
  open,
  onOpenChange,
  matchType,
  sideAPlayer1,
  sideAPlayer2,
  sideBPlayer1,
  sideBPlayer2,
  onComplete,
}: TossDialogProps) {
  const [step, setStep] = useState<Step>("TOSS_WINNER")
  const [tossWinner, setTossWinner] = useState<TossWinner | null>(null)
  const [tossChoice, setTossChoice] = useState<TossChoice | null>(null)
  const [servingSide, setServingSide] = useState<"A" | "B" | null>(null)
  const [courtSwapped, setCourtSwapped] = useState(false)
  const [serverName, setServerName] = useState<string | null>(null)

  const resetState = () => {
    setStep("TOSS_WINNER")
    setTossWinner(null)
    setTossChoice(null)
    setServingSide(null)
    setCourtSwapped(false)
    setServerName(null)
  }

  const handleClose = () => {
    onOpenChange(false)
    resetState()
  }

  const sideALabel = sideAPlayer2
    ? `${sideAPlayer1} & ${sideAPlayer2}`
    : sideAPlayer1

  const sideBLabel = sideBPlayer2
    ? `${sideBPlayer1} & ${sideBPlayer2}`
    : sideBPlayer1

  const getSideLabel = (side: "A" | "B") => (side === "A" ? sideALabel : sideBLabel)

  const tossLoser = tossWinner === "A" ? "B" : "A"
  const receivingSide = servingSide === "A" ? "B" : "A"

  // Step 1: Who won the toss?
  const handleTossWinner = (winner: TossWinner) => {
    setTossWinner(winner)
    setStep("WINNER_CHOICE")
  }

  // Step 2: What does the winner choose?
  const handleWinnerChoice = (choice: TossChoice) => {
    setTossChoice(choice)
    if (choice === "SERVE") {
      setServingSide(tossWinner!)
    } else {
      setServingSide(tossLoser)
    }
    setStep("COURT_SIDE")
  }

  // Step 3: Court side selection
  const handleCourtSide = (courtChoice: CourtSide) => {
    const choosingSide = tossChoice === "SERVE" ? tossLoser : tossWinner!
    const swapped =
      (choosingSide === "A" && courtChoice === "RIGHT") ||
      (choosingSide === "B" && courtChoice === "LEFT")
    setCourtSwapped(swapped)

    if (matchType === "DOUBLES") {
      setStep("SERVER_PICK")
    } else {
      const name = servingSide === "A" ? sideAPlayer1 : sideBPlayer1
      onComplete({
        tossWonBy: tossWinner!,
        tossChoice: tossChoice!,
        servingSide: servingSide!,
        serverName: name,
        courtSwapped: swapped,
      })
      resetState()
    }
  }

  // Step 4 (doubles): Pick which player serves
  const handleServerPick = (name: string) => {
    setServerName(name)
    setStep("RECEIVER_PICK")
  }

  // Step 5 (doubles): Pick which player receives
  const handleReceiverPick = (receiverName: string) => {
    onComplete({
      tossWonBy: tossWinner!,
      tossChoice: tossChoice!,
      servingSide: servingSide!,
      serverName: serverName!,
      receiverName,
      courtSwapped,
    })
    resetState()
  }

  const handleBack = () => {
    switch (step) {
      case "WINNER_CHOICE":
        setTossWinner(null)
        setStep("TOSS_WINNER")
        break
      case "COURT_SIDE":
        setTossChoice(null)
        setServingSide(null)
        setStep("WINNER_CHOICE")
        break
      case "SERVER_PICK":
        setCourtSwapped(false)
        setStep("COURT_SIDE")
        break
      case "RECEIVER_PICK":
        setServerName(null)
        setStep("SERVER_PICK")
        break
    }
  }

  const stepNumbers: Record<Step, number> = {
    TOSS_WINNER: 1,
    WINNER_CHOICE: 2,
    COURT_SIDE: 3,
    SERVER_PICK: 4,
    RECEIVER_PICK: 5,
  }
  const stepNumber = stepNumbers[step]
  const totalSteps = matchType === "DOUBLES" ? 5 : 3

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Match Toss</DialogTitle>
          <DialogDescription>
            Step {stepNumber} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Step 1: Toss Winner */}
          {step === "TOSS_WINNER" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Who won the toss?</h3>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-5 px-6 border-2 hover:border-green-500 hover:bg-green-50 whitespace-normal"
                  onClick={() => handleTossWinner("A")}
                >
                  <div className="font-semibold text-base text-left w-full">{sideALabel}</div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-5 px-6 border-2 hover:border-blue-500 hover:bg-blue-50 whitespace-normal"
                  onClick={() => handleTossWinner("B")}
                >
                  <div className="font-semibold text-base text-left w-full">{sideBLabel}</div>
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Winner's Choice */}
          {step === "WINNER_CHOICE" && tossWinner && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">
                What does {getSideLabel(tossWinner)} choose?
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-5 px-6 border-2 hover:border-yellow-500 hover:bg-yellow-50 whitespace-normal"
                  onClick={() => handleWinnerChoice("SERVE")}
                >
                  <div className="text-left w-full">
                    <div className="font-semibold text-base">Serve First</div>
                    <div className="text-sm text-muted-foreground">
                      {getSideLabel(tossWinner)} will serve, {getSideLabel(tossLoser)} picks court side
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-5 px-6 border-2 hover:border-purple-500 hover:bg-purple-50 whitespace-normal"
                  onClick={() => handleWinnerChoice("SIDE")}
                >
                  <div className="text-left w-full">
                    <div className="font-semibold text-base">Choose Court Side</div>
                    <div className="text-sm text-muted-foreground">
                      {getSideLabel(tossWinner)} picks court side, {getSideLabel(tossLoser)} will serve
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Court Side Selection */}
          {step === "COURT_SIDE" && tossWinner && tossChoice && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">
                {tossChoice === "SERVE"
                  ? `Which court side does ${getSideLabel(tossLoser)} want?`
                  : `Which court side does ${getSideLabel(tossWinner)} want?`}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-6 px-4 border-2 hover:border-green-500 hover:bg-green-50 flex flex-col items-center gap-2"
                  onClick={() => handleCourtSide("LEFT")}
                >
                  <span className="text-2xl">&#8592;</span>
                  <div className="font-semibold">Left Side</div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 px-4 border-2 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center gap-2"
                  onClick={() => handleCourtSide("RIGHT")}
                >
                  <span className="text-2xl">&#8594;</span>
                  <div className="font-semibold">Right Side</div>
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Server Pick (doubles only) */}
          {step === "SERVER_PICK" && servingSide && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">
                Which player serves first?
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                From {getSideLabel(servingSide)} (serving side)
              </p>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-5 px-6 border-2 hover:border-yellow-500 hover:bg-yellow-50 whitespace-normal"
                  onClick={() => handleServerPick(servingSide === "A" ? sideAPlayer1 : sideBPlayer1)}
                >
                  <div className="font-semibold text-base">
                    {servingSide === "A" ? sideAPlayer1 : sideBPlayer1}
                  </div>
                </Button>
                {(servingSide === "A" ? sideAPlayer2 : sideBPlayer2) && (
                  <Button
                    variant="outline"
                    className="h-auto py-5 px-6 border-2 hover:border-yellow-500 hover:bg-yellow-50 whitespace-normal"
                    onClick={() => handleServerPick(servingSide === "A" ? sideAPlayer2! : sideBPlayer2!)}
                  >
                    <div className="font-semibold text-base">
                      {servingSide === "A" ? sideAPlayer2 : sideBPlayer2}
                    </div>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Receiver Pick (doubles only) */}
          {step === "RECEIVER_PICK" && servingSide && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">
                Who receives the serve?
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                From {getSideLabel(receivingSide)} (receiving side)
              </p>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-5 px-6 border-2 hover:border-orange-500 hover:bg-orange-50 whitespace-normal"
                  onClick={() => handleReceiverPick(receivingSide === "A" ? sideAPlayer1 : sideBPlayer1)}
                >
                  <div className="font-semibold text-base">
                    {receivingSide === "A" ? sideAPlayer1 : sideBPlayer1}
                  </div>
                </Button>
                {(receivingSide === "A" ? sideAPlayer2 : sideBPlayer2) && (
                  <Button
                    variant="outline"
                    className="h-auto py-5 px-6 border-2 hover:border-orange-500 hover:bg-orange-50 whitespace-normal"
                    onClick={() => handleReceiverPick(receivingSide === "A" ? sideAPlayer2! : sideBPlayer2!)}
                  >
                    <div className="font-semibold text-base">
                      {receivingSide === "A" ? sideAPlayer2 : sideBPlayer2}
                    </div>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {step !== "TOSS_WINNER" ? (
            <Button variant="ghost" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
