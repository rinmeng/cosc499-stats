'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { Check, Copy, Share2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { useBanner } from '@/components/banner-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
} from '@/components/ui/message';
import { SITE_URL } from '@/lib/site';
import type { ShareItem } from '@/lib/types';

/** Who replies in the mock text message. */
const REPLIER = { login: 'rinmeng', name: 'Rin' };

const noSubscribe = () => () => {};

/** The title shown in a link preview, same as the page's Open Graph title. */
const previewTitle = (item: ShareItem) => `UBCO COSC 499 · ${item.title}`;

/** The line sent above the link. */
const messageText = (item: ShareItem) => {
  if (item.path.startsWith('/u/')) return 'look at my capstone stats lol';
  if (item.path.startsWith('/insights'))
    return 'look at what AI did to capstone teams lol';
  // /<cohort>/<team> is a team page; /<cohort> is a whole cohort.
  return item.path.split('/').filter(Boolean).length > 1
    ? 'look at our team’s capstone stats lol'
    : 'look at our cohort’s capstone stats lol';
};

/** A link preview as it shows up in a text message: image, title, description, domain. */
function LinkCard({ item }: { item: ShareItem }) {
  return (
    <div className='w-64 overflow-hidden rounded-2xl bg-black text-left text-white'>
      <Image
        unoptimized
        src={`${item.path === '/' ? '' : item.path}/opengraph-image`}
        alt=''
        width={1200}
        height={630}
        className='aspect-[1200/630] w-full border-b border-white/15 bg-white
          object-cover'
      />
      <div className='space-y-0.5 px-3 py-2'>
        <p className='line-clamp-2 text-[13px] leading-snug font-semibold'>
          {previewTitle(item)}
        </p>
        <p className='line-clamp-2 text-xs leading-snug text-white/70'>
          {item.description}
        </p>
        <p className='truncate text-[11px] text-white/50'>{new URL(SITE_URL).host}</p>
      </div>
    </div>
  );
}

/** Share a team or person page, with a preview of the text message it will become. */
export function ShareDialog({
  item,
  open,
  onOpenChange,
}: {
  item: ShareItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(
    noSubscribe,
    () => typeof navigator.share === 'function',
    () => false
  );
  const url = item ? `${SITE_URL}${item.path === '/' ? '' : item.path}` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link is still shown in the preview to copy by hand.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setCopied(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {item?.title}</DialogTitle>
          <DialogDescription>
            This is roughly how the link looks when you text it.
          </DialogDescription>
        </DialogHeader>
        {item && (
          <div className='rounded-2xl bg-muted p-3'>
            <MessageGroup>
              <Message align='end'>
                <MessageContent>
                  <Bubble align='end' variant='default'>
                    <BubbleContent>
                      {messageText(item)}
                      <br />
                      <span className='break-all'>{url}</span>
                    </BubbleContent>
                  </Bubble>
                  <Bubble align='end' variant='ghost'>
                    <BubbleContent>
                      <LinkCard item={item} />
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
              <Message align='start'>
                <MessageAvatar>
                  <Avatar className='size-8'>
                    <AvatarImage
                      src={`https://github.com/${REPLIER.login}.png?size=64`}
                      alt=''
                    />
                    <AvatarFallback className='text-[10px]'>
                      {REPLIER.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </MessageAvatar>
                <MessageContent>
                  <Bubble
                    variant='secondary'
                    className='*:data-[slot=bubble-content]:bg-foreground/10!'
                  >
                    <BubbleContent>wow! that’s so sick!</BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </MessageGroup>
          </div>
        )}
        <DialogFooter className='flex-row! *:flex-1'>
          {canShare && item && (
            <Button
              variant='outline'
              onClick={() =>
                navigator
                  .share({ title: previewTitle(item), text: messageText(item), url })
                  .catch(() => {})
              }
            >
              <Share2 className='size-4' /> Share
            </Button>
          )}
          <Button onClick={copy}>
            {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Share" button for a page. It stays fixed at the top right of the screen, just under
 * the navbar, so sharing is one click away wherever you are on the page.
 */
export function ShareButton({ item }: { item: ShareItem }) {
  const [open, setOpen] = useState(false);
  // The announcement strip sits inside the fixed navbar; drop below it while it shows.
  const { dismissed } = useBanner();
  return (
    <>
      {/* Same width and gutters as the page, so the button lines up with the content. */}
      <div
        className={cn(
          'pointer-events-none fixed inset-x-0 z-40 transition-[top]',
          dismissed ? 'top-16' : 'top-28'
        )}
      >
        <div className='page-container flex justify-end'>
          <Button
            size='sm'
            variant='outline'
            className='pointer-events-auto rounded-full shadow-lg'
            onClick={() => setOpen(true)}
          >
            <Share2 className='size-4' /> Share
          </Button>
        </div>
      </div>
      <ShareDialog item={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
