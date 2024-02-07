import { red, yellow } from 'fmt/colors.ts'

export function printError(tag: string, message: string) {
    console.error(red('[ERROR]'), `[${tag}]`, red(message))
}

export function printWarning(tag: string, message: string) {
    console.error(yellow('[WARNING]'), `[${tag}]`, yellow(message))
}

export function printLog(tag: string, message: string) {
    console.log('[LOG]', `[${tag}]`, message)
}