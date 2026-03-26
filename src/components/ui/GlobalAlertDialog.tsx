"use client"

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
import { useAlertDialogStore } from "@/hooks/useAlertDialog"

export function GlobalAlertDialog() {
  const {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    variant,
    onConfirm,
    onCancel,
    closeDialog,
  } = useAlertDialogStore()

  const handleConfirm = () => {
    onConfirm?.()
    closeDialog()
  }

  const handleCancel = () => {
    onCancel?.()
    closeDialog()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {cancelText && (
            <AlertDialogCancel onClick={handleCancel}>
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleConfirm}
            className={variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {confirmText || "OK"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
