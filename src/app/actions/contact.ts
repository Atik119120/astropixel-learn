export interface CreateContactMessageInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function submitContactMessageAction(input: CreateContactMessageInput) {
  const { name, email, subject, message } = input;

  if (!name || !email || !message) {
    return { error: 'Name, email, and message are required.' };
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const contactMsg = await prisma.contactMessage.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        subject,
        message,
        status: 'UNREAD',
      },
    });

    return { success: true, contactMsg };
  } catch (error: any) {
    console.error('Submit contact message error:', error?.message || error);
    return { error: error?.message || 'Failed to submit contact message.' };
  }
}
