import { ComponentProps } from "react"
import { twMerge } from 'tailwind-merge'

export function ErrorBox(props: ComponentProps<'div'>) {
  return (
    <div {...props} className={twMerge(props.className, 'bg-red-500/25 border border-2 border-red-500 rounded p-2')}>
      {props.children}
    </div>
  )
}
