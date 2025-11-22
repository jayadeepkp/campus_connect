import { ComponentProps } from "react"
import { twMerge } from 'tailwind-merge'
import { BaseIssue, isValiError } from "valibot"
import { isKnownError } from "~/api/hooks"

export function ErrorBox(props: ComponentProps<'div'>) {
  return (
    <div {...props} className={twMerge(props.className, 'bg-red-500/25 border border-2 border-red-500 rounded p-2')}>
      {props.children}
    </div>
  )
}

function AllIssues({ issues }: { issues: BaseIssue<unknown>[] }): JSX.Element {
  return (
    <ul className="space-y-2 py-2">
      {issues.map(issue => {
        return (
          <li className="bg-white/25 border-white/25 dark:bg-black/25 border dark:border-black/25 rounded-lg p-2">
            {`${issue.kind}: ${issue.message} at ${issue.path?.map(item => item.key)}`}
            {issue.issues !== undefined && <AllIssues issues={issue.issues} />}
          </li>
        )
      })}
    </ul>
  )
}

export function StandardErrorBox({ explanation, error, ...props }: { explanation: string, error: unknown } & ComponentProps<'div'>) {
  if (isKnownError(error)) {
    console.error([error])
    return <ErrorBox {...props}>{explanation}: {error.error}</ErrorBox>
  } else if (isValiError(error)) {
    return <ErrorBox {...props}>{explanation}: Validation errors: <AllIssues issues={error.issues} /></ErrorBox>
  } else if (error instanceof Error) {
    console.error([error])
    return <ErrorBox {...props}>{explanation}: Unknown error: {error.name} {error.message}</ErrorBox>
  }
  return <></>
}
