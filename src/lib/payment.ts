export interface CreateOrderParams {
  studentId: string;
  courseId: string;
  amount: number;
  paymentMethod?: string;
  couponCode?: string;
}

export interface PaymentVerificationParams {
  orderId: string;
  transactionId: string;
  status: 'VERIFIED' | 'FAILED';
}

export async function createOrderService(params: CreateOrderParams) {
  const { studentId, courseId, amount, paymentMethod = 'bKash/Nagad', couponCode } = params;

  try {
    const { prisma } = await import('@/lib/prisma');

    let finalAmount = amount;

    // Verify coupon if provided
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      });
      if (coupon && coupon.active && coupon.usedCount < coupon.maxUses) {
        finalAmount = Math.max(0, amount - (amount * coupon.discountPercent) / 100);
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Free course auto-enrollment
    if (finalAmount === 0) {
      const enrollment = await prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId, courseId } },
        update: {},
        create: {
          studentId,
          courseId,
          progress: 0,
        },
      });

      return {
        success: true,
        freeEnrollment: true,
        enrollment,
      };
    }

    // Create Order record
    const order = await prisma.order.create({
      data: {
        studentId,
        totalAmount: finalAmount,
        status: 'PENDING',
        payments: {
          create: {
            amount: finalAmount,
            paymentMethod,
            status: 'PENDING',
          },
        },
      },
      include: {
        payments: true,
      },
    });

    return {
      success: true,
      order,
    };
  } catch (error: any) {
    console.error('Create order error:', error?.message || error);
    return { error: error?.message || 'Failed to create order.' };
  }
}

export async function verifyPaymentService(params: PaymentVerificationParams) {
  const { orderId, transactionId, status } = params;

  try {
    const { prisma } = await import('@/lib/prisma');

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) return { error: 'Order not found.' };

    if (status === 'VERIFIED') {
      // 1. Mark Order completed
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' },
      });

      // 2. Mark Payment verified
      if (order.payments.length > 0) {
        await prisma.payment.update({
          where: { id: order.payments[0].id },
          data: {
            transactionId,
            status: 'VERIFIED',
          },
        });
      }

      // 3. Create Notification
      await prisma.notification.create({
        data: {
          userId: order.studentId,
          title: 'Payment Successful',
          message: `Your payment of ৳${order.totalAmount} has been verified successfully.`,
          type: 'ENROLLMENT',
        },
      });

      return { success: true, orderId };
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
      return { error: 'Payment verification failed.' };
    }
  } catch (error: any) {
    return { error: error?.message || 'Failed to verify payment.' };
  }
}
