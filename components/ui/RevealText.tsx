'use client';
import { motion } from 'framer-motion';

interface RevealTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  className?: string;
  once?: boolean;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const word = {
  hidden: { y: '100%' },
  show: { y: '0%', transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

export const RevealText = ({ text, as = 'h2', className = '', once = true }: RevealTextProps) => {
  const MotionTag = (motion as any)[as];
  const lines = text.split('\n');

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-80px' }}
      variants={container}
    >
      {lines.map((line, li) => (
        <span className="block" key={li}>
          {line.split(' ').map((w, wi) => (
            <span key={wi} className="inline-block overflow-hidden pb-[0.08em] mr-[0.25em] last:mr-0 align-top">
              <motion.span variants={word} className="inline-block">
                {w}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </MotionTag>
  );
};
