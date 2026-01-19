import React from 'react'

export const isReactElement = <P>(child: React.ReactNode): child is React.ReactElement<P> =>
  React.isValidElement<P>(child) && typeof child.type !== 'string' && child.type !== React.Fragment

export const cloneChildrenWithProps = <P>(
  children: React.ReactNode,
  props?: Partial<P>
): React.ReactNode => React.Children.map(children, (child) => cloneChild(child, props))

const cloneChild = <P>(child: React.ReactNode, props?: Partial<P>): React.ReactNode => {
  if (!React.isValidElement(child)) {
    return child
  }

  if (props && isReactElement<P>(child)) {
    return React.cloneElement<P>(child, { ...props, ...child.props })
  }

  return React.cloneElement(child)
}
