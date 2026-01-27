import { create } from 'zustand'

export const useThemeDownloadStore = create((set) => ({
  themes: [],
  loading: false,
  downloadStatus: null,
  downloadProgress: 0,
  downloadMessage: '',
  downloadedFiles: null,
  activeThemeId: null,
  
  setThemes: (themes) => set({ themes }),
  setLoading: (loading) => set({ loading }),
  
  setDownloadStatus: (status) => set({ downloadStatus: status }),
  setDownloadProgress: (progress) => set({ downloadProgress: progress }),
  setDownloadMessage: (message) => set({ downloadMessage: message }),
  setDownloadedFiles: (files) => set({ downloadedFiles: files }),
  setActiveThemeId: (themeId) => set({ activeThemeId: themeId }),
  
  resetDownload: () => set({
    downloadStatus: null,
    downloadProgress: 0,
    downloadMessage: '',
    downloadedFiles: null,
    activeThemeId: null
  })
}))
