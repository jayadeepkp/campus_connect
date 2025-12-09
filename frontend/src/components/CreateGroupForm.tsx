// src/components/CreateGroupForm.tsx
import { useState, FormEvent } from 'react';
import { Heading } from 'react-aria-components';
import { useCreateGroup } from '~/api/hooks';
import { Button } from '~/ui/Button';
import { Checkbox } from '~/ui/Checkbox';
import { Dialog } from '~/ui/Dialog';
import { StandardErrorBox } from '~/ui/ErrorBox';
import { Form } from '~/ui/Form';
import { Modal } from '~/ui/Modal';
import { TextAreaField, TextField } from '~/ui/TextField';

export function CreateGroupForm({ isOpen, setOpen }: { isOpen: boolean; setOpen(value: boolean): void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const createGroup = useCreateGroup()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    await createGroup.mutateAsync({
      name,
      description,
      isPublic,
    })
    setOpen(false)
  }

  return (
    <Modal isDismissable isOpen={isOpen} onOpenChange={setOpen}>
      <Dialog>
        <Heading slot="title" className="text-xl font-bold pb-4">Create a new group</Heading>

        <Form onSubmit={handleSubmit}>
          <TextField label="Group name" placeholder="CS Freshman Hangout" value={name} onChange={setName} isRequired isDisabled={createGroup.isPending} />
          <TextAreaField label="Description" placeholder="Describe your group in a few words" value={description} onChange={setDescription} isDisabled={createGroup.isPending} />
          <Checkbox isSelected={isPublic} onChange={setIsPublic} isDisabled={createGroup.isPending}>Should this group be public and discoverable to others?</Checkbox>
          <Button isPending={createGroup.isPending} type="submit">Create group</Button>
          <StandardErrorBox explanation="Failed to create a group" error={createGroup.error} />
        </Form>
      </Dialog>
    </Modal>
  );
}
