import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ok, created } from '../../utils/response';

export async function listTestimonials(req: Request, res: Response) {
  const { featured } = req.query;
  const testimonials = await prisma.testimonial.findMany({
    where: featured === 'true' ? { isFeatured: true } : undefined,
    orderBy: { orderIndex: 'asc' },
  });
  return ok(res, testimonials);
}

export async function createTestimonial(req: Request, res: Response) {
  const testimonial = await prisma.testimonial.create({ data: req.body });
  return created(res, testimonial);
}

export async function updateTestimonial(req: Request, res: Response) {
  const testimonial = await prisma.testimonial.update({
    where: { id: req.params.id },
    data: req.body,
  });
  return ok(res, testimonial);
}

export async function deleteTestimonial(req: Request, res: Response) {
  await prisma.testimonial.delete({ where: { id: req.params.id } });
  return ok(res, { success: true });
}
