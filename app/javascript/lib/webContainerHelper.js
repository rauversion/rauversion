/**
 * WebContainer Integration Helper
 * 
 * This utility provides helper functions for integrating theme files
 * with WebContainer (https://webcontainer.io/)
 * 
 * Note: WebContainer must be initialized separately and passed to these functions
 */

/**
 * Write theme files to WebContainer
 * @param {WebContainer} webcontainer - Initialized WebContainer instance
 * @param {Array} files - Array of file objects with {path, content, size}
 * @param {string} basePath - Base path to write files (default: '/')
 * @returns {Promise<number>} Number of files written
 */
export async function writeThemeFilesToContainer(webcontainer, files, basePath = '/') {
  if (!webcontainer) {
    throw new Error('WebContainer instance is required')
  }

  if (!files || !Array.isArray(files)) {
    throw new Error('Files must be an array')
  }

  let filesWritten = 0

  for (const file of files) {
    if (!file.path || !file.content) {
      console.warn('Skipping invalid file:', file)
      continue
    }

    try {
      const fullPath = basePath === '/' 
        ? file.path 
        : `${basePath}/${file.path}`.replace(/\/+/g, '/')

      // Create directory structure if needed
      const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'))
      if (dirPath && dirPath !== '/') {
        await webcontainer.fs.mkdir(dirPath, { recursive: true })
      }

      // Write file
      await webcontainer.fs.writeFile(fullPath, file.content)
      filesWritten++
    } catch (error) {
      console.error(`Failed to write file ${file.path}:`, error)
    }
  }

  return filesWritten
}

/**
 * Create a file tree structure for WebContainer from theme files
 * @param {Array} files - Array of file objects with {path, content, size}
 * @returns {Object} File tree object compatible with WebContainer
 */
export function createFileTree(files) {
  const tree = {}

  for (const file of files) {
    const parts = file.path.split('/')
    let current = tree

    // Navigate/create directory structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current[part]) {
        current[part] = {
          directory: {}
        }
      }
      current = current[part].directory
    }

    // Add file
    const fileName = parts[parts.length - 1]
    current[fileName] = {
      file: {
        contents: file.content
      }
    }
  }

  return tree
}

/**
 * Mount theme files to WebContainer using file tree
 * @param {WebContainer} webcontainer - Initialized WebContainer instance
 * @param {Array} files - Array of file objects
 * @param {string} mountPoint - Mount point (default: '/')
 * @returns {Promise<void>}
 */
export async function mountThemeFiles(webcontainer, files, mountPoint = '/') {
  if (!webcontainer) {
    throw new Error('WebContainer instance is required')
  }

  const fileTree = createFileTree(files)
  
  if (mountPoint === '/') {
    await webcontainer.mount(fileTree)
  } else {
    await webcontainer.mount({ [mountPoint]: { directory: fileTree } })
  }
}

/**
 * Example usage:
 * 
 * ```javascript
 * import { WebContainer } from '@webcontainer/api';
 * import { writeThemeFilesToContainer, mountThemeFiles } from '@/lib/webContainerHelper';
 * 
 * // Initialize WebContainer
 * const webcontainer = await WebContainer.boot();
 * 
 * // Method 1: Write files individually
 * function handleThemeFiles(files) {
 *   const count = await writeThemeFilesToContainer(webcontainer, files);
 *   console.log(`Wrote ${count} files to WebContainer`);
 * }
 * 
 * // Method 2: Mount entire file tree at once (more efficient)
 * function handleThemeFiles(files) {
 *   await mountThemeFiles(webcontainer, files);
 *   console.log('Theme files mounted to WebContainer');
 * }
 * 
 * // Use in DevEditorNew component
 * <DevEditorNew onThemeFilesReady={handleThemeFiles} />
 * ```
 */
