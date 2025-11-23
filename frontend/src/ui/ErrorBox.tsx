import { ComponentProps } from "react"
import { DialogTrigger } from "react-aria-components"
import { twMerge } from 'tailwind-merge'
import { BaseIssue, isValiError } from "valibot"
import { isKnownError } from "~/api/hooks"
import { Button } from "./Button"
import { Code } from "lucide-react"
import { Popover } from "./Popover"
import { Dialog } from "./Dialog"

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
            <DialogTrigger>
              <Button variant="icon" className="inline-block"><Code size={16} /></Button>
              <Popover>
                <Dialog>
                  <code><pre>{JSON.stringify(issue.input, null, 2)}</pre></code>
                </Dialog>
              </Popover>
            </DialogTrigger>
            {`${issue.kind} ${issue.type}: ${issue.message} at `}{issue.path?.map(item => {
              return (
                <DialogTrigger>
                  <Button variant="icon" className="inline-block">{`${item.key}`}</Button>
                  <Popover>
                    <Dialog>
                      <code><pre>{JSON.stringify(item.input, null, 2)}</pre></code>
                    </Dialog>
                  </Popover>
                </DialogTrigger>
              )
            })}
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
