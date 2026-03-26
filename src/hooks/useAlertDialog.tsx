"use client"

import { create } from "zustand"

interface AlertDialogState {
  isOpen: boolean
  title: string
  message: string
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

interface AlertDialogStore extends AlertDialogState {
  showAlert: (config: Omit<AlertDialogState, "isOpen">) => void
  showConfirm: (config: Omit<AlertDialogState, "isOpen">) => Promise<boolean>
  closeDialog: () => void
}

export const useAlertDialogStore = create<AlertDialogStore>((set) => ({
  isOpen: false,
  title: "",
  message: "",
  confirmText: "OK",
  cancelText: "Cancel",
  variant: "default",

  showAlert: (config) => {
    set({
      ...config,
      isOpen: true,
      cancelText: undefined,
    })
  },

  showConfirm: (config) => {
    return new Promise<boolean>((resolve) => {
      set({
        ...config,
        isOpen: true,
        onConfirm: () => {
          resolve(true)
          set({ isOpen: false })
        },
        onCancel: () => {
          resolve(false)
          set({ isOpen: false })
        },
      })
    })
  },

  closeDialog: () => set({ isOpen: false }),
}))

export function useAlertDialog() {
  const store = useAlertDialogStore()

  const alert = (message: string, title = "Notification") => {
    store.showAlert({
      title,
      message,
      confirmText: "OK",
      onConfirm: () => store.closeDialog(),
    })
  }

  const confirm = async (message: string, title = "Confirm Action") => {
    return store.showConfirm({
      title,
      message,
      confirmText: "Confirm",
      cancelText: "Cancel",
    })
  }

  const confirmDelete = async (message: string) => {
    return store.showConfirm({
      title: "Delete Confirmation",
      message,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    })
  }

  return { alert, confirm, confirmDelete }
}
