'use client';
import { Link as AriaLink, LinkProps as AriaLinkProps, composeRenderProps } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { focusRing } from './utils';
import { createLink } from '@tanstack/react-router';

interface LinkProps extends AriaLinkProps {
  variant?: 'primary' | 'secondary' | 'title'
}

const styles = tv({
  extend: focusRing,
  base: 'underline disabled:no-underline disabled:cursor-default forced-colors:disabled:text-[GrayText] transition rounded-xs',
  variants: {
    variant: {
      primary: 'text-fuchsia-600 dark:text-fuchsia-500 underline decoration-fuchsia-600/60 hover:decoration-fuchsia-600 dark:decoration-fuchsia-500/60 dark:hover:decoration-fuchsia-500',
      secondary: 'text-gray-700 dark:text-zinc-300 underline decoration-gray-700/50 hover:decoration-gray-700 dark:decoration-zinc-300/70 dark:hover:decoration-zinc-300',
      title: 'no-underline',
    }
  },
  defaultVariants: {
    variant: 'primary'
  }
});

function StyledLink(props: LinkProps) {
  return <AriaLink {...props} className={composeRenderProps(props.className, (className, renderProps) =>  styles({...renderProps, className, variant: props.variant}))} />;
}

export const Link = createLink(StyledLink)
