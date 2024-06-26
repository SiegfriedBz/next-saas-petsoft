'use client'

import DateSelector from '@/components/DateSelector'
import FormError from '@/components/FormError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import usePetsContext from '@/hooks/usePetsContext'
import { TPetEssentials } from '@/types/pet.types'
import { mutatePetSchema, type TMutatePetInput } from '@/zod/mutatePet.zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useTransition } from 'react'
import { DateRange } from 'react-day-picker'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type TProps = {
  selectedPet?: TPetEssentials
  closeDialog: () => void
}
const MutatePetForm = ({ selectedPet, closeDialog }: TProps) => {
  const isEditForm = Boolean(selectedPet)
  const [range, setRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<TMutatePetInput>({
    resolver: zodResolver(mutatePetSchema)
  })

  const [isPending, startTransition] = useTransition()
  const { handleAddPet, handleUpdatePet } = usePetsContext()

  // Initialize form values when editing a pet
  useEffect(() => {
    if (!isEditForm || !selectedPet) return

    Object.entries(selectedPet).forEach(([key, value]) => {
      if (key === 'checkInDate' || key === 'checkOutDate') {
        if (selectedPet.checkInDate !== null) {
          setValue('checkInDate', new Date(selectedPet.checkInDate))
        }
        if (selectedPet.checkOutDate !== null) {
          setValue('checkOutDate', new Date(selectedPet.checkOutDate))
        }
        setRange({
          from: selectedPet.checkInDate ?? undefined,
          to: selectedPet.checkOutDate ?? undefined
        })
      } else {
        setValue(key as keyof TMutatePetInput, value ?? '')
      }
    })
  }, [isEditForm, selectedPet, setValue])

  // update checkInDate / checkOutDate RHF fields values on range change
  useEffect(() => {
    range?.from &&
      setValue('checkInDate', (range as { from: Date; to: Date }).from)
    range?.to &&
      setValue('checkOutDate', (range as { from: Date; to: Date }).to)
  }, [setValue, range])

  // on submit form
  const action: () => void = handleSubmit((data) => {
    // add pet default img if not provided by user
    if (!data?.imageUrl) {
      data.imageUrl =
        'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=100&w=1935&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    }

    // close dialog box
    closeDialog()

    // optimistic update + server-actions
    startTransition(async () => {
      try {
        isEditForm
          ? await handleUpdatePet(data as TMutatePetInput)
          : await handleAddPet(data as TMutatePetInput)
      } catch (error) {
        const err = error as Error
        console.error('Error in MutatePetForm:', err)
        toast.error(
          `Failed to ${isEditForm ? 'edit' : 'add'} pet - ${err.message}.`
        )
      }
    })
  })

  return (
    <form
      action={action}
      className='w-full max-md:space-y-6 space-y-4 overflow-y-scroll max-h-[75svh]'
    >
      {/* id of the pet */}
      {isEditForm && <input type='hidden' {...register('id')} />}

      <div className='px-1'>
        <Label htmlFor='name'>Pet&apos; name</Label>
        <Input {...register('name')} id='name' />
        <FormError error={errors.name} />
      </div>

      <div className='px-1'>
        <Label htmlFor='imageUrl'>Image url</Label>
        <Input {...register('imageUrl')} id='imageUrl' />
        <FormError error={errors.imageUrl} />
      </div>

      <div className='px-1'>
        <Label htmlFor='age'>Age</Label>
        <Input {...register('age')} id='age' />
        <FormError error={errors.age} />
      </div>

      <div className='px-1'>
        <Label htmlFor='breed'>Breed</Label>
        <Input {...register('breed')} id='breed' />
        <FormError error={errors.breed} />
      </div>

      <div className='px-1'>
        <Label htmlFor='notes'>Notes</Label>
        <Textarea {...register('notes')} id='notes' />
        <FormError error={errors.notes} />
      </div>

      <div className='px-1'>
        <Label htmlFor='ownerName'>Owner name</Label>
        <Input {...register('ownerName')} id='ownerName' />
        <FormError error={errors.ownerName} />
      </div>

      <div className='px-1'>
        <Label htmlFor='ownerPhoneNum'>Owner phone number</Label>
        <Input {...register('ownerPhoneNum')} id='ownerPhoneNum' />
        <FormError error={errors.ownerPhoneNum} />
      </div>

      <div className='flex flex-col'>
        <Label>Dates</Label>
        <DateSelector range={range} setRange={setRange} />
        <Button
          className='self-end mr-5 '
          type='button'
          variant='ghost'
          onClick={() => setRange({ from: undefined, to: undefined })}
        >
          Clear dates
        </Button>
        <FormError error={errors.checkInDate} />
        <FormError error={errors.checkOutDate} />
      </div>

      <Button disabled={isPending} type='submit' className='mt-4 w-full'>
        {isEditForm ? 'Edit pet' : 'Add a new pet'}
      </Button>
    </form>
  )
}

export default MutatePetForm
