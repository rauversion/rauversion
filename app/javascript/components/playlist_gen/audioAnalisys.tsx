export async function analyzeWaveform(audioBuffer: AudioBuffer): Promise<number[]> {
  const channelData = audioBuffer.getChannelData(0) // Get first channel
  const samples = channelData.length
  const dataPoints = 200 // Number of points for waveform visualization
  const blockSize = Math.floor(samples / dataPoints)
  const waveformData: number[] = []

  for (let i = 0; i < dataPoints; i++) {
    const start = blockSize * i
    let sum = 0

    // Calculate RMS (root mean square) for this block
    for (let j = 0; j < blockSize; j++) {
      const sample = channelData[start + j] || 0
      sum += sample * sample
    }

    const rms = Math.sqrt(sum / blockSize)
    // Normalize to 0-100 range with some amplification
    const normalized = Math.min(100, rms * 500)
    waveformData.push(normalized)
  }

  return waveformData
}

export async function detectBPM(audioBuffer: AudioBuffer): Promise<number> {
  // Simplified BPM detection
  // In a real implementation, you would use more sophisticated algorithms
  // like autocorrelation or FFT-based beat detection

  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate

  // Calculate energy in chunks
  const chunkSize = Math.floor(sampleRate * 0.1) // 100ms chunks
  const energyValues: number[] = []

  for (let i = 0; i < channelData.length; i += chunkSize) {
    let energy = 0
    for (let j = i; j < i + chunkSize && j < channelData.length; j++) {
      energy += Math.abs(channelData[j])
    }
    energyValues.push(energy / chunkSize)
  }

  // Find peaks (simplified beat detection)
  const threshold = (energyValues.reduce((a, b) => a + b, 0) / energyValues.length) * 1.5
  const peaks: number[] = []

  for (let i = 1; i < energyValues.length - 1; i++) {
    if (energyValues[i] > threshold && energyValues[i] > energyValues[i - 1] && energyValues[i] > energyValues[i + 1]) {
      peaks.push(i)
    }
  }

  // Calculate average interval between peaks
  if (peaks.length < 2) {
    return 128 // Default BPM if detection fails
  }

  const intervals: number[] = []
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1])
  }

  const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const bpm = Math.round(60 / (averageInterval * 0.1)) // Convert to BPM

  // Clamp to reasonable range
  if (bpm < 60 || bpm > 200) {
    return 128 // Return default if detected BPM is unreasonable
  }

  return bpm
}
