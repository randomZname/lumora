import Accordion from '@/components/Accordion';
import { BRAND } from '@/lib/brand';

const faqs = [
  {
    question: 'Do I need an image to make a video?',
    answer:
      'No. Upload a reference image for image-to-video, or just write a prompt for text-to-video. Both work in the studio.',
  },
  {
    question: 'How long do renders take?',
    answer:
      'Most clips land in roughly 30–90 seconds depending on the model and queue. You get a live status while it renders.',
  },
  {
    question: 'Which image formats are supported?',
    answer: 'JPEG, PNG, and WEBP up to 5MB. Files are validated before anything is processed.',
  },
  {
    question: 'How do credits work?',
    answer:
      'Each successful clip spends one credit. Plans include monthly credits and you can top up anytime. Failed renders are never charged.',
  },
  {
    question: 'Will you store my prompts?',
    answer:
      'Only the metadata needed to run and show your job. Your prompts stay yours.',
  },
  {
    question: 'Can I use the clips commercially?',
    answer:
      'Output usage follows the underlying model provider terms. Premium plans target full commercial use.',
  },
];

export default function FAQPage() {
  return (
    <div className="space-y-8 py-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.25em] text-aura-iris">FAQ</p>
        <h1 className="font-display text-4xl font-semibold text-aura-ink sm:text-5xl">
          Answers for creators.
        </h1>
        <p className="max-w-2xl text-aura-mute">
          Everything you need before your first {BRAND.name} render.
        </p>
      </div>

      <Accordion items={faqs} />
    </div>
  );
}
