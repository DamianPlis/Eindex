"use client"

import React from 'react'
import { useFormStatus } from "react-dom";
import { removeDeadlineAction } from '@/app/(app)/actions'

function RemoveButton() {
    const formStatus = useFormStatus();
    const { pending } = formStatus;


    return (        
      <button className="deadline-action-button remove-button" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Removing..." : "X"}
      </button>
    )
}

function RemoveDeadline({ deadline }: { deadline: { id: string } }) {
  return (
    <form action={removeDeadlineAction}>
        <input type="hidden" name="id" value={deadline.id} />
        <RemoveButton />
    </form>
  )
}

export default RemoveDeadline