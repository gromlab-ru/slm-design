import type { ComponentPropsWithoutRef } from 'react'

/** Собственные параметры SignInForm. */
export type SignInFormParams = object

/** Атрибуты корневой form. */
type RootAttrs = Omit<ComponentPropsWithoutRef<'form'>, 'children' | 'onSubmit'>

/** Props формы входа. */
export type SignInFormProps = RootAttrs & SignInFormParams
