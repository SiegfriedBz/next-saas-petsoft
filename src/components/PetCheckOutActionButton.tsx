'use client'

import { Button } from '@/components/ui/button'
import usePetsContext from '@/hooks/usePetsContext'
import type { TPetEssentials } from '@/types/pet.types'
import { useTransition } from 'react'
import { toast } from 'sonner'

type TProps = {
  className?: string
  selectedPetId?: TPetEssentials['id']
  children?: React.ReactNode
}
const PetCheckOutActionButton = ({
  className,
  selectedPetId,
  children
}: TProps) => {
  const { handleDeletePet } = usePetsContext()
  const [isPending, startTransition] = useTransition()

  const onCheckout = () => {
    startTransition(() => {
      handleDeletePet(selectedPetId as TPetEssentials['id']).catch(
        (err: Error) => toast.error(`Failed to check out pet - ${err.message}.`)
      )
    })
  }

  return (
    <Button
      disabled={isPending}
      onClick={onCheckout}
      variant='secondary'
      className={className}
    >
      {children}
    </Button>
  )
}

export default PetCheckOutActionButton
