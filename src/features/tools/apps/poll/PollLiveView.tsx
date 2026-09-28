import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, Share2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Poll {
  id: string;
  question: string;
  options: { label: string }[];
  share_code: string | null;
  created_at: string;
  user_id: string;
}

interface Props {
  poll: Poll;
  onDone: () => void;
}

export default function PollLiveView({ poll, onDone }: Props) {
  const shareUrl = `${window.location.origin}/tools?poll=${poll.share_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied!');
  };

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: poll.question, url: shareUrl });
    } else {
      copyLink();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Success Hero */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
      </motion.div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground">Poll is Live!</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">{poll.question}</p>
      </div>

      {/* QR Code */}
      <Card className="w-full max-w-xs">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG value={shareUrl} size={160} />
          </div>
          <p className="text-[10px] text-muted-foreground text-center break-all">{shareUrl}</p>
        </CardContent>
      </Card>

      {/* Share Actions */}
      <div className="flex gap-2 w-full max-w-xs">
        <Button variant="outline" className="flex-1 gap-2" onClick={copyLink}>
          <Copy className="w-4 h-4" /> Copy Link
        </Button>
        <Button className="flex-1 gap-2" onClick={nativeShare}>
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </div>

      <Button variant="ghost" size="sm" onClick={onDone} className="mt-2 text-muted-foreground">
        Back to My Polls
      </Button>
    </div>
  );
}
