"use client"

import React from 'react'
import { useFormStatus } from "react-dom";
import { markAsDoneDeadlineAction } from '@/app/(app)/actions'
import Check from "@/icons/check_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";

function DoneButton() {
    const formStatus = useFormStatus();
    const { pending } = formStatus;


    return (        
      <button className="deadline-action-button done-button" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Marking as done..." : <Check alt="Mark deadline as done" fill="currentColor" width="" height="" />}
      </button>
    )
}

function MarkDeadlineDone({ deadline }: { deadline: { id: string } }) {
  return (
    <form action={markAsDoneDeadlineAction}>
        <input type="hidden" name="id" value={deadline.id} />
        <DoneButton />
    </form>
  )
}

export default MarkDeadlineDone