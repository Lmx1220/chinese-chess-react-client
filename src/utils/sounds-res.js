import config from '@/config.js'
import { Howl } from 'howler'
import background from '../assets/sounds/background.mp3'
import btn from '../assets/sounds/btn.mp3'
import capture from '../assets/sounds/capture.mp3'
import eatchess from '../assets/sounds/eatchess.mp3'
import fail from '../assets/sounds/fail.mp3'
import killboss from '../assets/sounds/killboss.mp3'
import message from '../assets/sounds/message.mp3'
import move from '../assets/sounds/move.mp3'
import peace from '../assets/sounds/peace.mp3'
import peopleeat from '../assets/sounds/peopleeat.mp3'
import start from '../assets/sounds/start.mp3'
import timeout from '../assets/sounds/timeout.mp3'
import win from '../assets/sounds/win.mp3'

/**
 * 音效文件
 * @type {Howl}
 */
export const killBossSound = new Howl({ src: killboss })
export const messageSound = new Howl({ src: message })
export const backgroundSound = new Howl({ src: background })
export const moveSound = new Howl({ src: move })
export const startSound = new Howl({ src: start })
export const peopleEatSound = new Howl({ src: peopleeat })
export const btnSound = new Howl({ src: btn })
export const timeoutSound = new Howl({ src: timeout })
export const winSound = new Howl({ src: win })
export const captureSound = new Howl({ src: capture })
export const eatChessSound = new Howl({ src: eatchess })
export const peaceSound = new Howl({ src: peace })
export const failSound = new Howl({ src: fail })

const soundList = []

/**
 * 播放音效
 * @param sound
 */
export function playSound(sound) {
  if (config.music && sound) {
    sound.play()
    soundList.push(sound)
    sound.once('end', () => {
      removeSound(sound)
    })
  }
}

/**
 * 结束音乐
 * @param sound
 */
export function stopSound(sound) {
  if (sound) {
    sound.stop()
    removeSound(sound)
  }
}

/**
 * 暂停播放
 * @param sound
 */
export function pauseSound(sound) {
  if (sound) {
    sound.pause()
    removeSound(sound)
  }
}

/**
 * 暂停全部播放内容
 */
export function pauseAllSound() {
  soundList.forEach(sound => sound.pause())
}

/**
 * 启动全部播放内容
 */
export function startAllSound() {
  soundList.forEach((sound) => {
    if (!sound.playing()) {
      sound.play()
    }
  })
}

/**
 * 移除音乐(内部方法)
 * @param sound
 */
function removeSound(sound) {
  const index = soundList.findIndex(item => item === sound)
  if (index !== -1) {
    soundList.splice(index, 1)
  }
}
