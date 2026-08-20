import { useState, useEffect, useMemo } from 'react';
import { EDGE_FUNCTIONS_URL } from '@/integrations/supabase/config';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import TrustBar from '@/components/TrustBar';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ZaloChatCard from '@/components/ZaloChatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, Copy, AlertCircle, Sparkles, Share2 } from 'lucide-react';
import { toast } from 'sonner';

// ===================== CSV URL (Bß║«T BUß╗ÿC D├ÖNG ─É├ÜNG) =====================
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y/export?format=csv&gid=139400129';

// Edge function URL for fetching SIM data (bypass CORS)
const getEdgeFunctionUrl = () => `${EDGE_FUNCTIONS_URL}/fetch-sim-data`;

// ===================== INVENTORY ITEM TYPE =====================
interface InventoryItem {
  simId: string;      // SimID from sheet (required)
  phone: string;      // Formatted phone (may have dots)
  digits: string;     // Normalized digits only
  price: number;
}

// ===================== DATA: 80 QUß║║ =====================
type HexagramLevel = '─Éß║íi c├ít' | 'C├ít' | 'B├¼nh th╞░ß╗¥ng' | 'Hung' | '─Éß║íi hung';

interface Hexagram {
  index: number;
  title: string;
  short: string;
  level: HexagramLevel;
}

const HEXAGRAMS: Record<number, Hexagram> = {
  1: { index: 1, title: "─Éß║íi triß╗ân hß╗ông ─æ├┤, khß║ú ─æ╞░ß╗úc th├ánh c├┤ng", short: "─Éß║íi triß╗ân hß╗ông ─æ├┤, khß║ú ─æ╞░ß╗úc th├ánh c├┤ng", level: "C├ít" },
  2: { index: 2, title: "Th─âng trß║ºm kh├┤ng sß╗æ, vß╗ü gi├á v├┤ c├┤ng", short: "Th─âng trß║ºm kh├┤ng sß╗æ, vß╗ü gi├á v├┤ c├┤ng", level: "B├¼nh th╞░ß╗¥ng" },
  3: { index: 3, title: "Ng├áy ng├áy tiß║┐n tß╗¢i, vß║ín sß╗▒ thuß║¡n to├án", short: "Ng├áy ng├áy tiß║┐n tß╗¢i, vß║ín sß╗▒ thuß║¡n to├án", level: "─Éß║íi c├ít" },
  4: { index: 4, title: "Tiß╗ün ─æß╗ô gai g├│c, d├óu khß╗ò theo ─æuß╗òi", short: "Tiß╗ün ─æß╗ô gai g├│c, d├óu khß╗ò theo ─æuß╗òi", level: "Hung" },
  5: { index: 5, title: "L├ám ─ân ph├ít ─æß║ít, lß╗úi danh ─æß╗üu c├│", short: "L├ám ─ân ph├ít ─æß║ít, lß╗úi danh ─æß╗üu c├│", level: "─Éß║íi c├ít" },
  6: { index: 6, title: "Trß╗¥i cho sß╗æ phß║¡n c├│ thß╗â th├ánh c├┤ng", short: "Trß╗¥i cho sß╗æ phß║¡n c├│ thß╗â th├ánh c├┤ng", level: "C├ít" },
  7: { index: 7, title: "├ön h├▓a ├¬m dß╗ïu nhß║Ñt phß║úi th├ánh c├┤ng", short: "├ön h├▓a ├¬m dß╗ïu nhß║Ñt phß║úi th├ánh c├┤ng", level: "C├ít" },
  8: { index: 8, title: "Qua giai ─æoß║ín gian nan, c├│ ng├áy th├ánh c├┤ng", short: "Qua giai ─æoß║ín gian nan, c├│ ng├áy th├ánh c├┤ng", level: "C├ít" },
  9: { index: 9, title: "Tß╗▒ l├ám c├│ sß╗⌐c thß║Ñt bß║íi kh├│ l╞░ß╗¥ng", short: "Tß╗▒ l├ám c├│ sß╗⌐c thß║Ñt bß║íi kh├│ l╞░ß╗¥ng", level: "Hung" },
  10: { index: 10, title: "T├óm sß╗⌐c l├ám kh├┤ng, kh├┤ng ─æ╞░ß╗úc ─æß║┐n bß╗¥", short: "T├óm sß╗⌐c l├ám kh├┤ng, kh├┤ng ─æ╞░ß╗úc ─æß║┐n bß╗¥", level: "Hung" },
  11: { index: 11, title: "Vß╗»ng ─æi tß╗½ng b╞░ß╗¢c, ─æ╞░ß╗úc ng╞░ß╗¥i trß╗ìng vß╗ìng", short: "Vß╗»ng ─æi tß╗½ng b╞░ß╗¢c, ─æ╞░ß╗úc ng╞░ß╗¥i trß╗ìng vß╗ìng", level: "C├ít" },
  12: { index: 12, title: "Gß║ºy g├▓ yß║┐u ─æuß╗æi, mß╗ìi viß╗çc kh├│ th├ánh", short: "Gß║ºy g├▓ yß║┐u ─æuß╗æi, mß╗ìi viß╗çc kh├│ th├ánh", level: "Hung" },
  13: { index: 13, title: "Trß╗¥i cho c├ít vß║¡n, ─æ╞░ß╗úc ng╞░ß╗¥i k├¡nh trß╗ìng", short: "Trß╗¥i cho c├ít vß║¡n, ─æ╞░ß╗úc ng╞░ß╗¥i k├¡nh trß╗ìng", level: "C├ít" },
  14: { index: 14, title: "Nß╗¡a ─æ╞░ß╗úc nß╗¡a bß║íi, dß╗▒a v├áo nghß╗ï lß╗▒c", short: "Nß╗¡a ─æ╞░ß╗úc nß╗¡a bß║íi, dß╗▒a v├áo nghß╗ï lß╗▒c", level: "B├¼nh th╞░ß╗¥ng" },
  15: { index: 15, title: "─Éß║íi sß╗▒ th├ánh tß╗▒u, nhß║Ñt ─æß╗ïnh h╞░ng v╞░╞íng", short: "─Éß║íi sß╗▒ th├ánh tß╗▒u, nhß║Ñt ─æß╗ïnh h╞░ng v╞░╞íng", level: "C├ít" },
  16: { index: 16, title: "Th├ánh tß╗▒u to lß╗¢n, t├¬n tuß╗òi lß╗½ng danh", short: "Th├ánh tß╗▒u to lß╗¢n, t├¬n tuß╗òi lß╗½ng danh", level: "─Éß║íi c├ít" },
  17: { index: 17, title: "Qu├╜ nh├ón trß╗ú gi├║p, sß║╜ ─æ╞░ß╗úc th├ánh c├┤ng", short: "Qu├╜ nh├ón trß╗ú gi├║p, sß║╜ ─æ╞░ß╗úc th├ánh c├┤ng", level: "C├ít" },
  18: { index: 18, title: "Thuß║¡n lß╗úi x╞░╞íng thß╗ïnh, tr─âm viß╗çc tr├┤i chß║úy", short: "Thuß║¡n lß╗úi x╞░╞íng thß╗ïnh, tr─âm viß╗çc tr├┤i chß║úy", level: "─Éß║íi c├ít" },
  19: { index: 19, title: "Nß╗Öi ngoß║íi bß║Ñt h├▓a, kh├│ kh─ân mu├┤n ph├ít", short: "Nß╗Öi ngoß║íi bß║Ñt h├▓a, kh├│ kh─ân mu├┤n ph├ít", level: "Hung" },
  20: { index: 20, title: "V╞░ß╗út mß╗ìi gian nan, lo xa ngh─⌐ ho├ái", short: "V╞░ß╗út mß╗ìi gian nan, lo xa ngh─⌐ ho├ái", level: "Hung" },
  21: { index: 21, title: "Chuy├¬n t├óm kinh doanh hay dung tr├¡", short: "Chuy├¬n t├óm kinh doanh hay dung tr├¡", level: "C├ít" },
  22: { index: 22, title: "C├│ t├ái kh├┤ng vß║¡n, viß╗çc kh├┤ng gß║╖p may", short: "C├│ t├ái kh├┤ng vß║¡n, viß╗çc kh├┤ng gß║╖p may", level: "Hung" },
  23: { index: 23, title: "T├¬n tuß╗òi 4 ph╞░╞íng, sß║╜ th├ánh ─æß║íi nghiß╗çp", short: "T├¬n tuß╗òi 4 ph╞░╞íng, sß║╜ th├ánh ─æß║íi nghiß╗çp", level: "─Éß║íi c├ít" },
  24: { index: 24, title: "Phß║úi dß╗▒a tß╗▒ lß║¡p sß║╜ th├ánh ─æß║íi nghiß╗çp", short: "Phß║úi dß╗▒a tß╗▒ lß║¡p sß║╜ th├ánh ─æß║íi nghiß╗çp", level: "C├ít" },
  25: { index: 25, title: "Thi├¬n thß╗¥i ─æß╗ïa lß╗úi v├¼ ─æ╞░ß╗úc nh├ón c├ích", short: "Thi├¬n thß╗¥i ─æß╗ïa lß╗úi v├¼ ─æ╞░ß╗úc nh├ón c├ích", level: "C├ít" },
  26: { index: 26, title: "Bß║úo t├íp phong ba qua ─æ╞░ß╗úc hiß╗âm nguy", short: "Bß║úo t├íp phong ba qua ─æ╞░ß╗úc hiß╗âm nguy", level: "Hung" },
  27: { index: 27, title: "L├║c thß║»ng l├║c thua giß╗» ─æ╞░ß╗úc th├ánh c├┤ng", short: "L├║c thß║»ng l├║c thua giß╗» ─æ╞░ß╗úc th├ánh c├┤ng", level: "C├ít" },
  28: { index: 28, title: "Tiß║┐n m├úi kh├┤ng l├╣i tr├¡ tuß╗ç ─æ╞░ß╗úc dung", short: "Tiß║┐n m├úi kh├┤ng l├╣i tr├¡ tuß╗ç ─æ╞░ß╗úc dung", level: "─Éß║íi c├ít" },
  29: { index: 29, title: "C├ít hung chia ─æß╗ò, ─æ╞░ß╗úc thua mß╗ùi nß╗¡a", short: "C├ít hung chia ─æß╗ò, ─æ╞░ß╗úc thua mß╗ùi nß╗¡a", level: "Hung" },
  30: { index: 30, title: "Danh lß╗úi ─æ╞░ß╗úc m├╣a ─æß║íi sß╗▒ th├ánh c├┤ng", short: "Danh lß╗úi ─æ╞░ß╗úc m├╣a ─æß║íi sß╗▒ th├ánh c├┤ng", level: "─Éß║íi c├ít" },
  31: { index: 31, title: "Con rß╗ông trong n╞░ß╗¢c th├ánh c├┤ng sß║╜ ─æß║┐n", short: "Con rß╗ông trong n╞░ß╗¢c th├ánh c├┤ng sß║╜ ─æß║┐n", level: "─Éß║íi c├ít" },
  32: { index: 32, title: "D├╣ng tr├¡ l├óu d├ái, sß║╜ ─æ╞░ß╗úc thß╗ïnh v╞░ß╗úng", short: "D├╣ng tr├¡ l├óu d├ái, sß║╜ ─æ╞░ß╗úc thß╗ïnh v╞░ß╗úng", level: "C├ít" },
  33: { index: 33, title: "Rß╗ºi ro kh├┤ng ngß╗½ng kh├│ c├│ th├ánh c├┤ng", short: "Rß╗ºi ro kh├┤ng ngß╗½ng kh├│ c├│ th├ánh c├┤ng", level: "Hung" },
  34: { index: 34, title: "Sß╗æ phß║¡n trung cß║Ñt tiß║┐n l├╣i bß║úo thß╗º", short: "Sß╗æ phß║¡n trung cß║Ñt tiß║┐n l├╣i bß║úo thß╗º", level: "B├¼nh th╞░ß╗¥ng" },
  35: { index: 35, title: "Tr├┤i nß╗òi bß║¡p b├╣ng th╞░ß╗¥ng hay gß║╖p nß║ín", short: "Tr├┤i nß╗òi bß║¡p b├╣ng th╞░ß╗¥ng hay gß║╖p nß║ín", level: "Hung" },
  36: { index: 36, title: "Tr├ính ─æ╞░ß╗úc ─æiß╗âm ├íc, thuß║¡n buß╗ôm xu├┤i gi├│", short: "Tr├ính ─æ╞░ß╗úc ─æiß╗âm ├íc, thuß║¡n buß╗ôm xu├┤i gi├│", level: "C├ít" },
  37: { index: 37, title: "Danh th├¼ ─æ╞░ß╗úc tiß║┐ng lß╗úi th├¼ bß║▒ng kh├┤ng", short: "Danh th├¼ ─æ╞░ß╗úc tiß║┐ng lß╗úi th├¼ bß║▒ng kh├┤ng", level: "B├¼nh th╞░ß╗¥ng" },
  38: { index: 38, title: "─É╞░ß╗¥ng rß╗Öng th├¬nh thang nh├¼n thß║Ñy t╞░╞íng lai", short: "─É╞░ß╗¥ng rß╗Öng th├¬nh thang nh├¼n thß║Ñy t╞░╞íng lai", level: "─Éß║íi c├ít" },
  39: { index: 39, title: "L├║c thß╗ïnh l├║c suy ch├¼m nß╗òi v├┤ ─æß╗ïnh", short: "L├║c thß╗ïnh l├║c suy ch├¼m nß╗òi v├┤ ─æß╗ïnh", level: "B├¼nh th╞░ß╗¥ng" },
  40: { index: 40, title: "Thi├¬n ├╜ cß║Ñt vß║¡n tiß╗ün ─æß╗ô sang sß╗ºa", short: "Thi├¬n ├╜ cß║Ñt vß║¡n tiß╗ün ─æß╗ô sang sß╗ºa", level: "─Éß║íi c├ít" },
  41: { index: 41, title: "Sß╗▒ nghiß╗çp kh├┤ng chuy├¬n hß║ºu nh╞░ kh├┤ng th├ánh", short: "Sß╗▒ nghiß╗çp kh├┤ng chuy├¬n hß║ºu nh╞░ kh├┤ng th├ánh", level: "Hung" },
  42: { index: 42, title: "Nhß║½n nhß╗ïn chß╗ïu ─æß╗▒ng, xß║Ñu sß║╜ th├ánh tß╗æt", short: "Nhß║½n nhß╗ïn chß╗ïu ─æß╗▒ng, xß║Ñu sß║╜ th├ánh tß╗æt", level: "C├ít" },
  43: { index: 43, title: "C├óy xanh trß╗ò l├í ─æß╗Öt nhi├¬n th├ánh c├┤ng", short: "C├óy xanh trß╗ò l├í ─æß╗Öt nhi├¬n th├ánh c├┤ng", level: "C├ít" },
  44: { index: 44, title: "Ng╞░ß╗úc vß╗¢i ├╜ m├¼nh tham c├┤ng lß╗í viß╗çc", short: "Ng╞░ß╗úc vß╗¢i ├╜ m├¼nh tham c├┤ng lß╗í viß╗çc", level: "Hung" },
  45: { index: 45, title: "Quanh co kh├║y khß╗╖u kh├│ kh─ân k├⌐o d├ái", short: "Quanh co kh├║y khß╗╖u kh├│ kh─ân k├⌐o d├ái", level: "Hung" },
  46: { index: 46, title: "Qu├╜ nh├ón gi├║p ─æß╗í th├ánh c├┤ng ─æß║íi sß╗▒", short: "Qu├╜ nh├ón gi├║p ─æß╗í th├ánh c├┤ng ─æß║íi sß╗▒", level: "─Éß║íi c├ít" },
  47: { index: 47, title: "Danh lß╗úi ─æß╗üu c├│ th├ánh c├┤ng tß╗æt ─æß║╣p", short: "Danh lß╗úi ─æß╗üu c├│ th├ánh c├┤ng tß╗æt ─æß║╣p", level: "─Éß║íi c├ít" },
  48: { index: 48, title: "Cß║╖p c├ít ─æ╞░ß╗úc c├ít gß║╖p hung th├¼ hung", short: "Cß║╖p c├ít ─æ╞░ß╗úc c├ít gß║╖p hung th├¼ hung", level: "B├¼nh th╞░ß╗¥ng" },
  49: { index: 49, title: "Hung c├ít c├╣ng c├│, mß╗Öt th├ánh mß╗Öt bß║íi", short: "Hung c├ít c├╣ng c├│, mß╗Öt th├ánh mß╗Öt bß║íi", level: "B├¼nh th╞░ß╗¥ng" },
  50: { index: 50, title: "Mß╗Öt thß╗ïnh mß╗Öt suy bß║¡p b├╣n s├│ng gi├│", short: "Mß╗Öt thß╗ïnh mß╗Öt suy bß║¡p b├╣n s├│ng gi├│", level: "B├¼nh th╞░ß╗¥ng" },
  51: { index: 51, title: "Trß╗¥i quang m├óy tß║ính nay ─æ╞░ß╗úc th├ánh c├┤ng", short: "Trß╗¥i quang m├óy tß║ính nay ─æ╞░ß╗úc th├ánh c├┤ng", level: "C├ít" },
  52: { index: 52, title: "S╞░ß╗¢ng thß╗ïnh nß╗¡a sß╗æ c├ít tr╞░ß╗¢c hung sau", short: "S╞░ß╗¢ng thß╗ïnh nß╗¡a sß╗æ c├ít tr╞░ß╗¢c hung sau", level: "Hung" },
  53: { index: 53, title: "Nß╗ò lß╗▒c hß║┐t m├¼nh th├ánh c├┤ng ├¡ch ß╗Åi", short: "Nß╗ò lß╗▒c hß║┐t m├¼nh th├ánh c├┤ng ├¡ch ß╗Åi", level: "B├¼nh th╞░ß╗¥ng" },
  54: { index: 54, title: "Bß╗ü ngo├ái t╞░╞íi sang ß║⌐n hß╗ìa sß║╜ tß╗¢i", short: "Bß╗ü ngo├ái t╞░╞íi sang ß║⌐n hß╗ìa sß║╜ tß╗¢i", level: "Hung" },
  55: { index: 55, title: "Ng╞░ß╗úc lß║íi ├╜ m├¼nh, c├│ c├│ th├ánh c├┤ng", short: "Ng╞░ß╗úc lß║íi ├╜ m├¼nh, c├│ c├│ th├ánh c├┤ng", level: "─Éß║íi hung" },
  56: { index: 56, title: "Nß╗ò lß╗▒c phß║Ñn ─æß║Ñu phß║¡n tß╗æt quay vß╗ü", short: "Nß╗ò lß╗▒c phß║Ñn ─æß║Ñu phß║¡n tß╗æt quay vß╗ü", level: "C├ít" },
  57: { index: 57, title: "Bß║Ñp b├¬nh nhiß╗üu chuyß║┐n hung tr╞░ß╗¢c tß╗æt sau", short: "Bß║Ñp b├¬nh nhiß╗üu chuyß║┐n hung tr╞░ß╗¢c tß╗æt sau", level: "B├¼nh th╞░ß╗¥ng" },
  58: { index: 58, title: "Gß║╖p viß╗çc do dß╗▒ kh├│ c├│ th├ánh c├┤ng", short: "Gß║╖p viß╗çc do dß╗▒ kh├│ c├│ th├ánh c├┤ng", level: "Hung" },
  59: { index: 59, title: "M╞í m╞í hß╗ô hß╗ô kh├│ c├│ ─æß╗ïnh ph╞░╞íng h╞░ß╗¢ng", short: "M╞í m╞í hß╗ô hß╗ô kh├│ c├│ ─æß╗ïnh ph╞░╞íng h╞░ß╗¢ng", level: "B├¼nh th╞░ß╗¥ng" },
  60: { index: 60, title: "M├óy che nß╗¡a tr─âng dß║Ñu hiß╗çu phong ba", short: "M├óy che nß╗¡a tr─âng dß║Ñu hiß╗çu phong ba", level: "Hung" },
  61: { index: 61, title: "Lo nghß╗ë nhiß╗üu ─æiß╗üu mß╗ìi viß╗çc kh├┤ng th├ánh", short: "Lo nghß╗ë nhiß╗üu ─æiß╗üu mß╗ìi viß╗çc kh├┤ng th├ánh", level: "Hung" },
  62: { index: 62, title: "Biß║┐t h╞░ß╗¢ng nß╗ò lß╗▒c con ─æ╞░ß╗¥ng phß╗ôn vinh", short: "Biß║┐t h╞░ß╗¢ng nß╗ò lß╗▒c con ─æ╞░ß╗¥ng phß╗ôn vinh", level: "C├ít" },
  63: { index: 63, title: "M╞░ß╗¥i viß╗çc ch├¡n kh├┤ng mß║Ñt c├┤ng mß║Ñt sß╗⌐c", short: "M╞░ß╗¥i viß╗çc ch├¡n kh├┤ng mß║Ñt c├┤ng mß║Ñt sß╗⌐c", level: "Hung" },
  64: { index: 64, title: "C├ít vß║¡n tß╗▒ ─æß║┐n, c├│ ─æ╞░ß╗úc th├ánh c├┤ng", short: "C├ít vß║¡n tß╗▒ ─æß║┐n, c├│ ─æ╞░ß╗úc th├ánh c├┤ng", level: "C├ít" },
  65: { index: 65, title: "Nß╗Öi ngoß║íi bß║Ñt h├▓a thiß║┐u thß╗æn t├¡n nhiß╗çm", short: "Nß╗Öi ngoß║íi bß║Ñt h├▓a thiß║┐u thß╗æn t├¡n nhiß╗çm", level: "B├¼nh th╞░ß╗¥ng" },
  66: { index: 66, title: "Mß╗ìi viß╗çc nh╞░ ├╜ ph├║ qu├╜ tß╗▒ ─æß║┐n", short: "Mß╗ìi viß╗çc nh╞░ ├╜ ph├║ qu├╜ tß╗▒ ─æß║┐n", level: "─Éß║íi c├ít" },
  67: { index: 67, title: "Nß║»m ─æ╞░ß╗úc thß╗¥i c╞í, th├ánh c├┤ng sß║╜ ─æß║┐n", short: "Nß║»m ─æ╞░ß╗úc thß╗¥i c╞í, th├ánh c├┤ng sß║╜ ─æß║┐n", level: "C├ít" },
  68: { index: 68, title: "Lo tr╞░ß╗¢c ngh─⌐ sau th╞░ß╗¥ng hay gß║╖p nß║ín", short: "Lo tr╞░ß╗¢c ngh─⌐ sau th╞░ß╗¥ng hay gß║╖p nß║ín", level: "Hung" },
  69: { index: 69, title: "Bß║¡p b├¬n kh├│ tr├ính vß║Ñt vß║ú", short: "Bß║¡p b├¬n kh├│ tr├ính vß║Ñt vß║ú", level: "Hung" },
  70: { index: 70, title: "C├ít hung ─æß╗üu c├│ chß╗ë dß╗▒ ch├¡ kh├¡", short: "C├ít hung ─æß╗üu c├│ chß╗ë dß╗▒ ch├¡ kh├¡", level: "B├¼nh th╞░ß╗¥ng" },
  71: { index: 71, title: "─É╞░ß╗úc rß╗ôi lß║íi mß║Ñt kh├│ c├│ b├¼nh y├¬n", short: "─É╞░ß╗úc rß╗ôi lß║íi mß║Ñt kh├│ c├│ b├¼nh y├¬n", level: "Hung" },
  72: { index: 72, title: "An lß║íc tß╗▒ ─æß║┐n tß╗▒ nhi├¬n c├ít t╞░ß╗¥ng", short: "An lß║íc tß╗▒ ─æß║┐n tß╗▒ nhi├¬n c├ít t╞░ß╗¥ng", level: "C├ít" },
  73: { index: 73, title: "Nh╞░ l├á v├┤ m╞░u kh├│ ─æ╞░ß╗úc th├ánh ─æß║ít", short: "Nh╞░ l├á v├┤ m╞░u kh├│ ─æ╞░ß╗úc th├ánh ─æß║ít", level: "B├¼nh th╞░ß╗¥ng" },
  74: { index: 74, title: "Trong l├ánh c├│ hung tiß║┐n kh├┤ng bß║▒ng l├╣i", short: "Trong l├ánh c├│ hung tiß║┐n kh├┤ng bß║▒ng l├╣i", level: "B├¼nh th╞░ß╗¥ng" },
  75: { index: 75, title: "Nhiß╗üu ─æiß╗üu ─æß║íi hung, hiß╗çn t╞░ß╗úng ph├ón t├ín", short: "Nhiß╗üu ─æiß╗üu ─æß║íi hung, hiß╗çn t╞░ß╗úng ph├ón t├ín", level: "─Éß║íi hung" },
  76: { index: 76, title: "Khß╗ò tr╞░ß╗¢c s╞░ß╗¢ng sau, kh├┤ng bß╗ï thß║Ñt bß║íi", short: "Khß╗ò tr╞░ß╗¢c s╞░ß╗¢ng sau, kh├┤ng bß╗ï thß║Ñt bß║íi", level: "C├ít" },
  77: { index: 77, title: "Nß╗¡a ─æ╞░ß╗úc nß╗¡a mß║Ñt sang m├á kh├┤ng thß╗▒c", short: "Nß╗¡a ─æ╞░ß╗úc nß╗¡a mß║Ñt sang m├á kh├┤ng thß╗▒c", level: "B├¼nh th╞░ß╗¥ng" },
  78: { index: 78, title: "Tiß╗ün ─æß╗ô t╞░╞íi sang tr─âm ─æß║ºy hy vß╗ìng", short: "Tiß╗ün ─æß╗ô t╞░╞íi sang tr─âm ─æß║ºy hy vß╗ìng", level: "─Éß║íi c├ít" },
  79: { index: 79, title: "─É╞░ß╗úc rß╗ôi lß║íi mß║Ñt lo c┼⌐ng bß║▒ng kh├┤ng", short: "─É╞░ß╗úc rß╗ôi lß║íi mß║Ñt lo c┼⌐ng bß║▒ng kh├┤ng", level: "Hung" },
  80: { index: 80, title: "Sß╗æ phß║¡n cao nhß║Ñt, sß║╜ ─æ╞░ß╗úc th├ánh c├┤ng", short: "Sß╗æ phß║¡n cao nhß║Ñt, sß║╜ ─æ╞░ß╗úc th├ánh c├┤ng", level: "─Éß║íi c├ít" },
};

// FAQ data
const faqData = [
  {
    question: "B├│i sß╗æ ─æu├┤i SIM hoß║ít ─æß╗Öng nh╞░ thß║┐ n├áo?",
    answer: "C├┤ng thß╗⌐c dß╗▒a tr├¬n ph├⌐p chia 80 quß║╗ Kinh Dß╗ïch: lß║Ñy 4 hoß║╖c 6 sß╗æ cuß╗æi cß╗ºa SIM, chia cho 80, sß╗æ d╞░ (1-80) t╞░╞íng ß╗⌐ng vß╗¢i 1 quß║╗. Mß╗ùi quß║╗ c├│ luß║¡n giß║úi v├á ─æ├ính gi├í ri├¬ng."
  },
  {
    question: "N├¬n chß╗ìn 4 sß╗æ cuß╗æi hay 6 sß╗æ cuß╗æi?",
    answer: "4 sß╗æ cuß╗æi phß╗ò biß║┐n v├á dß╗à nhß╗¢ h╞ín, ph├╣ hß╗úp tra cß╗⌐u nhanh. 6 sß╗æ cuß╗æi cho kß║┐t quß║ú chi tiß║┐t h╞ín, th╞░ß╗¥ng d├╣ng khi cß║ºn ph├ón t├¡ch s├óu."
  },
  {
    question: "Kß║┐t quß║ú b├│i c├│ ch├¡nh x├íc 100% kh├┤ng?",
    answer: "─É├óy l├á c├┤ng cß╗Ñ tham khß║úo dß╗▒a tr├¬n Kinh Dß╗ïch v├á phong thß╗ºy d├ón gian, kh├┤ng phß║úi khoa hß╗ìc ch├¡nh x├íc. Kß║┐t quß║ú chß╗ë mang t├¡nh giß║úi tr├¡ v├á tham khß║úo."
  },
  {
    question: "Tß║íi sao c├╣ng mß╗Öt sß╗æ c├│ thß╗â ra quß║╗ kh├íc nhau?",
    answer: "Nß║┐u bß║ín chß╗ìn 4 sß╗æ cuß╗æi hoß║╖c 6 sß╗æ cuß╗æi, ph├⌐p t├¡nh sß║╜ kh├íc nhau n├¬n quß║╗ c┼⌐ng kh├íc. H├úy chß╗ìn ─æ├║ng ─æß╗Ö d├ái bß║ín muß╗æn tra cß╗⌐u."
  },
  {
    question: "L├ám sao ─æß╗â chß╗ìn SIM hß╗úp phong thß╗ºy?",
    answer: "Ngo├ái b├│i sß╗æ ─æu├┤i, bß║ín n├¬n xem x├⌐t th├¬m ng┼⌐ h├ánh bß║ún mß╗çnh, tß╗òng sß╗æ n├║t, c├ón bß║▒ng ├óm d╞░╞íng. Li├¬n hß╗ç t╞░ vß║Ñn vi├¬n ─æß╗â ─æ╞░ß╗úc hß╗ù trß╗ú chi tiß║┐t."
  }
];

// Level badge colors - Vibrant with glow
const getLevelBadgeClass = (level: HexagramLevel): string => {
  switch (level) {
    case '─Éß║íi c├ít':
      return 'bg-[#2ecc71] text-white border-[#2ecc71]/60 shadow-[0_0_12px_rgba(46,204,113,0.5)]';
    case 'C├ít':
      return 'bg-[#27ae60] text-white border-[#27ae60]/60 shadow-[0_0_12px_rgba(39,174,96,0.5)]';
    case 'B├¼nh th╞░ß╗¥ng':
      return 'bg-[#f4b400] text-black border-[#f4b400]/60 shadow-[0_0_12px_rgba(244,180,0,0.5)]';
    case 'Hung':
      return 'bg-[#ff4d4f] text-white border-[#ff4d4f]/60 shadow-[0_0_12px_rgba(255,77,79,0.5)]';
    case '─Éß║íi hung':
      return 'bg-[#ff4d4f] text-white border-[#ff4d4f]/60 shadow-[0_0_12px_rgba(255,77,79,0.6)]';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

// Format phone number for display (e.g., 0909272727 -> 0909.27.27.27)
const formatPhoneDisplay = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}.${digits.slice(8)}`;
  }
  return phone;
};

// Format price to VND
const formatPriceVND = (price: number): string => {
  return price.toLocaleString('vi-VN') + '─æ';
};

// ===================== PARSE CSV CHUß║¿N =====================
/**
 * Chuß║⌐n ho├í phone TRIß╗åT ─Éß╗é:
 * - Xß╗¡ l├╜ dß║íng "0909.27.27.27", "0909272727", "9.09272727E+9" (scientific notation)
 * - Loß║íi bß╗Å mß╗ìi k├╜ tß╗▒ kh├┤ng phß║úi sß╗æ
 * - Nß║┐u d├ái 9 v├á kh├┤ng bß║»t ─æß║ºu bß║▒ng 0 -> th├¬m '0' ─æß║ºu
 */
const normalizePhoneToDigits = (value: string): string => {
  let str = String(value).trim();
  
  // Xß╗¡ l├╜ scientific notation (e.g., 9.09272727E+9)
  if (str.toLowerCase().includes('e')) {
    try {
      const num = parseFloat(str);
      if (!isNaN(num)) {
        // Convert to full number string without scientific notation
        str = num.toLocaleString('fullwide', { useGrouping: false });
      }
    } catch {
      // If parse fails, continue with string processing
    }
  }
  
  // Loß║íi bß╗Å mß╗ìi k├╜ tß╗▒ kh├┤ng phß║úi sß╗æ
  let digits = str.replace(/\D/g, '');
  
  // Nß║┐u d├ái 9 v├á kh├┤ng bß║»t ─æß║ºu bß║▒ng 0, th├¬m '0' ─æß║ºu
  if (digits.length === 9 && digits[0] !== '0') {
    digits = '0' + digits;
  }
  
  return digits;
};

/**
 * Parse price tß╗½ nhiß╗üu ─æß╗ïnh dß║íng
 * Xß╗¡ l├╜: "  1,000,000,000 ", "18.000.000─æ", "18000000", "  990,000,000 "
 */
const parsePriceToNumber = (value: string): number => {
  if (!value) return 0;
  let s = String(value).trim();
  s = s.replace(/\s+/g, '').replace(/[─æ─É]/g, '');
  const digitsOnly = s.replace(/[^\d]/g, '');
  const n = parseInt(digitsOnly, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Parse CSV th├ánh array rows - hß╗ù trß╗ú dß║Ñu ngoß║╖c k├⌐p cho gi├í c├│ dß║Ñu phß║⌐y
 */
const parseCSVRows = (csvText: string): Record<string, string>[] => {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const splitCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // handle escaped quotes ""
        const next = line[i + 1];
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
        continue;
      }
      cur += ch;
    }
    out.push(cur.trim());
    return out.map(v => v.replace(/^"|"$/g, '').trim());
  };

  // remove BOM if any
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = splitCsvLine(headerLine).map(h => h.replace(/["']/g, '').trim());

  const result: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    result.push(row);
  }
  return result;
};

/**
 * Fetch v├á parse inventory tß╗½ CSV
 * Sß╗¡ dß╗Ñng Supabase Edge Function ─æß╗â bypass CORS
 * TUYß╗åT ─Éß╗ÉI kh├┤ng random, kh├┤ng mock
 * 
 * MAPPING Cß╗¿NG THEO HEADER SHEET:
 * - SimID
 * - Sß╗É THU├è BAO CHUß║¿N
 * - Sß╗É THU├è BAO
 * - Final_Price
 */
const fetchInventory = async (): Promise<InventoryItem[]> => {
  let csvText: string | null = null;
  
  // Primary: Use Edge Function (reliable, bypasses CORS)
  try {
    if (import.meta.env.DEV) {
      console.log('[SimPhongThuy] Fetching via edge function...');
    }
    const edgeFunctionUrl = getEdgeFunctionUrl();
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      csvText = await response.text();
      if (import.meta.env.DEV) {
        console.log('[SimPhongThuy] Edge function success:', csvText.length, 'bytes');
      }
    } else {
      console.error('[SimPhongThuy] Edge function error:', response.status);
    }
  } catch (err) {
    console.error('[SimPhongThuy] Edge function fetch failed:', err);
  }
  
  // Fallback: Try direct fetch (may fail due to CORS)
  if (!csvText) {
    try {
      if (import.meta.env.DEV) {
        console.log('[SimPhongThuy] Trying direct CSV fetch...');
      }
      const response = await fetch(CSV_URL, {
        method: 'GET',
        headers: { 'Accept': 'text/csv' },
      });
      
      if (response.ok) {
        csvText = await response.text();
        if (import.meta.env.DEV) {
          console.log('[SimPhongThuy] Direct fetch success:', csvText.length, 'bytes');
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[SimPhongThuy] Direct fetch failed (CORS?):', err);
      }
    }
  }
  
  // Check if we got HTML instead of CSV (error page)
  if (csvText && (csvText.includes('<html') || csvText.includes('<!DOCTYPE'))) {
    if (import.meta.env.DEV) {
      console.error('[SimPhongThuy] CSV returned HTML - check share/public');
    }
    return [];
  }
  
  if (!csvText) {
    if (import.meta.env.DEV) {
      console.warn('[SimPhongThuy] No CSV data, returning empty');
    }
    return [];
  }
  
  const rows = parseCSVRows(csvText);
  
  if (rows.length === 0) {
    if (import.meta.env.DEV) {
      console.warn('[SimPhongThuy] Empty CSV parsed');
    }
    return [];
  }
  
  // ===== MAPPING Cß╗¿NG THEO HEADER SHEET =====
  const inventory: InventoryItem[] = [];
  const seenDigits = new Set<string>();
  
  for (const row of rows) {
    // Filter by TRß║áNG TH├üI: only show "available" SIMs, hide "sold" ones
    const trangThai = (row['TRß║áNG TH├üI'] || row['TRANG THAI'] || row['TRANG_THAI'] || '').trim().toLowerCase();
    if (trangThai === 'sold' || trangThai === 'reserved') continue;
    
    // Map ─æ├║ng header Google Sheet
    const simId = row['SimID'] || '';
    const phone = row['Sß╗É THU├è BAO'] || row['Sß╗É THU├è BAO CHUß║¿N'] || '';
    const priceRaw = 
      row['Final_Price']?.trim() || 
      row['GI├ü B├üN']?.trim() || 
      row['GI├ü THU Vß╗Ç']?.trim() || 
      '';
    const price = parsePriceToNumber(priceRaw);
    
    // Validate: bß╗Å qua nß║┐u simId rß╗ùng
    if (!simId.trim()) continue;
    
    // Validate: bß╗Å qua nß║┐u phone rß╗ùng
    if (!phone) continue;
    
    // Validate: bß╗Å qua nß║┐u gi├í kh├┤ng hß╗úp lß╗ç (KH├öNG fallback vß╗ü 1)
    if (!Number.isFinite(price) || price <= 0) continue;
    
    // Normalize digits
    const digits = normalizePhoneToDigits(phone);
    
    // Validate: bß╗Å qua nß║┐u digits < 9 sß╗æ
    if (digits.length < 9) continue;
    
    // Dedup by digits
    if (seenDigits.has(digits)) continue;
    seenDigits.add(digits);
    
    inventory.push({
      simId: simId.trim(),
      phone, // Keep original format for display
      digits,
      price,
    });
  }
  
  // Debug log (chß╗ë DEV). Counts only ΓÇö never row contents or sheet column names,
  // both of which include internal pricing fields.
  if (import.meta.env.DEV) {
    console.log('[SimPhongThuy] inventory size:', inventory.length);
  }
  
  return inventory;
};

// Card style classes - Ruby red gradient with radial highlight and golden glow border
const cardBaseClass = "relative rounded-2xl p-6 md:p-8";
const cardStyle = {
  background: 'radial-gradient(ellipse at 50% 30%, rgba(180, 40, 50, 0.5) 0%, transparent 60%), linear-gradient(135deg, #5a0a0e 0%, #8b1a1a 40%, #6d1515 70%, #4a0d0d 100%)',
  border: '1px solid rgba(245, 194, 107, 0.45)',
  boxShadow: '0 0 25px rgba(245, 194, 107, 0.25), inset 0 1px 0 rgba(245, 194, 107, 0.1)',
};

// Fisher-Yates shuffle helper
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Pick items prioritizing those not in prevShown, then fill with old ones if needed
function pickWithoutRepeating(
  candidates: { item: InventoryItem; level: HexagramLevel; hexagram: Hexagram }[],
  n: number,
  prevShownDigits: Set<string>
): { item: InventoryItem; level: HexagramLevel; hexagram: Hexagram }[] {
  const newOnes = candidates.filter(c => !prevShownDigits.has(c.item.digits));
  const oldOnes = candidates.filter(c => prevShownDigits.has(c.item.digits));
  
  const shuffledNew = shuffle(newOnes);
  const shuffledOld = shuffle(oldOnes);
  
  return [...shuffledNew, ...shuffledOld].slice(0, n);
}

const SimPhongThuy = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [suffixLength, setSuffixLength] = useState<'4' | '6'>('4');
  const [result, setResult] = useState<{ suffix: string; que: number; hexagram: Hexagram } | null>(null);
  const [error, setError] = useState('');

  // State for real inventory from Google Sheet
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);

  // State for random suggestions
  const [prevShownDigits, setPrevShownDigits] = useState<Set<string>>(new Set());
  const [suggestionSeed, setSuggestionSeed] = useState<number>(0);

  // Load inventory from Google Sheet on mount (one time)
  useEffect(() => {
    fetchInventory()
      .then((data) => {
        setInventory(data);
        setInventoryLoaded(true);
      })
      .catch((err) => {
        console.error('[SimPhongThuy] Failed to load inventory:', err);
        setInventory([]);
        setInventoryLoaded(true);
      });
  }, []);

  // Parse URL params on load
  useEffect(() => {
    const sim = searchParams.get('sim');
    const len = searchParams.get('len');

    if (sim && (len === '4' || len === '6')) {
      setInputValue(sim);
      setSuffixLength(len);
      // Auto-lookup and trigger new random seed
      performLookup(sim, len);
      setSuggestionSeed(Date.now());
    }
    // Mount-only by design: this reads the *initial* deep link (?sim=&len=) once.
    // Adding the suggested deps would be actively wrong, not merely noisy ΓÇö
    // performLookup calls setSearchParams itself (see below), so a searchParams
    // dep turns this into a feedback loop that re-runs the auto-lookup and
    // re-seeds the random suggestions on every manual submit, clobbering what
    // the user just typed. performLookup is also declared below this effect, so
    // listing it is a TDZ error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performLookup = (input: string, len: '4' | '6') => {
    setError('');
    
    // Extract digits only
    const digits = input.replace(/\D/g, '');
    const requiredLen = parseInt(len);
    
    if (digits.length < requiredLen) {
      setError(`Vui l├▓ng nhß║¡p ├¡t nhß║Ñt ${requiredLen} sß╗æ ─æß╗â tra cß╗⌐u ${requiredLen} sß╗æ cuß╗æi.`);
      setResult(null);
      return;
    }
    
    // Get suffix
    const suffix = digits.slice(-requiredLen);
    const n = parseInt(suffix, 10);
    let que = n % 80;
    if (que === 0) que = 80;
    
    const hexagram = HEXAGRAMS[que];
    if (!hexagram) {
      setError('Kh├┤ng t├¼m thß║Ñy quß║╗ t╞░╞íng ß╗⌐ng.');
      setResult(null);
      return;
    }
    
    setResult({ suffix, que, hexagram });
    
    // Trigger new random suggestions
    setSuggestionSeed(Date.now());
    
    // Update URL
    setSearchParams({ sim: suffix, len });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(inputValue, suffixLength);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('─É├ú copy link!');
    }).catch(() => {
      toast.error('Kh├┤ng thß╗â copy link');
    });
  };

  // Navigate to checkout when clicking "Mua ngay" button
  const handleBuyNow = (item: InventoryItem) => {
    navigate(`/mua-ngay/${encodeURIComponent(item.simId)}`);
  };

  // ===================== ENGINE Gß╗óI ├¥ "SIM ─Éß║áI C├üT / C├üT" THEO suffixLength =====================
  // Logic: T├¡nh quß║╗ tß╗½ 4 hoß║╖c 6 sß╗æ ─æu├┤i (theo suffixLength hiß╗çn tß║íi), chß╗ë giß╗» "─Éß║íi c├ít" hoß║╖c "C├ít"
  // Hiß╗ân thß╗ï NGß║¬U NHI├èN 6 "─Éß║íi c├ít" + 6 "C├ít", ╞░u ti├¬n kh├┤ng lß║╖p lß║íi lß║ºn tr╞░ß╗¢c
  // Trß║ú vß╗ü 2 nh├│m: luckyGreat (6 "─Éß║íi c├ít") + luckyGood (6 "C├ít")
  const luckySuggestions = useMemo(() => {
    if (!inventoryLoaded || inventory.length === 0) {
      return { luckyGreat: [], luckyGood: [] };
    }

    const suffixLen = parseInt(suffixLength, 10); // 4 hoß║╖c 6

    const daiCatCandidates: { item: InventoryItem; level: HexagramLevel; hexagram: Hexagram }[] = [];
    const catCandidates: { item: InventoryItem; level: HexagramLevel; hexagram: Hexagram }[] = [];

    for (const item of inventory) {
      if (item.price <= 0 || item.digits.length < suffixLen) continue;

      // Lß║Ñy suffix theo suffixLength hiß╗çn tß║íi
      const suffix = item.digits.slice(-suffixLen);
      const n = parseInt(suffix, 10);
      if (isNaN(n)) continue;

      // T├¡nh quß║╗
      let que = n % 80;
      if (que === 0) que = 80;

      const hex = HEXAGRAMS[que];
      if (!hex) continue;

      // Ph├ón loß║íi theo level
      if (hex.level === '─Éß║íi c├ít') {
        daiCatCandidates.push({ item, level: hex.level, hexagram: hex });
      } else if (hex.level === 'C├ít') {
        catCandidates.push({ item, level: hex.level, hexagram: hex });
      }
    }

    // Sß╗¡ dß╗Ñng pickWithoutRepeating ─æß╗â chß╗ìn ngß║½u nhi├¬n ╞░u ti├¬n kh├┤ng lß║╖p
    const luckyGreat = pickWithoutRepeating(daiCatCandidates, 6, prevShownDigits);
    const luckyGood = pickWithoutRepeating(catCandidates, 6, prevShownDigits);

    if (import.meta.env.DEV) {
      console.log('[SimPhongThuy] Lucky suggestions - ─Éß║íi c├ít:', luckyGreat.length, ', C├ít:', luckyGood.length, ', seed:', suggestionSeed);
    }

    return { luckyGreat, luckyGood };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory, inventoryLoaded, suffixLength, suggestionSeed]);

  // Cß║¡p nhß║¡t prevShownDigits sau khi c├│ danh s├ích gß╗úi ├╜ mß╗¢i
  useEffect(() => {
    if (luckySuggestions.luckyGreat.length === 0 && luckySuggestions.luckyGood.length === 0) return;
    
    const newShownDigits = new Set<string>();
    luckySuggestions.luckyGreat.forEach(entry => newShownDigits.add(entry.item.digits));
    luckySuggestions.luckyGood.forEach(entry => newShownDigits.add(entry.item.digits));
    
    setPrevShownDigits(newShownDigits);
  }, [suggestionSeed, luckySuggestions.luckyGreat, luckySuggestions.luckyGood]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <Helmet>
        <title>Sim Phong Thß╗ºy ΓÇô B├│i SIM Hß║¡u Thi├¬n, Xem SIM Hß╗úp Mß╗çnh</title>
        <meta name="description" content="B├│i SIM phong thß╗ºy theo hß║¡u thi├¬n b├ít qu├íi: nhß║¡p 4ΓÇô6 sß╗æ ─æu├┤i ─æß╗â xem c├ít hung, quß║╗ chß╗º, hß╗úp mß╗çnh, hß╗úp tuß╗òi. Gß╗úi ├╜ SIM ─æß║╣p phong thß╗ºy." />
        <link rel="canonical" href="https://www.chonsomobifone.com/sim-phong-thuy" />
        <meta property="og:title" content="Sim Phong Thß╗ºy ΓÇô B├│i SIM Hß║¡u Thi├¬n, Xem SIM Hß╗úp Mß╗çnh" />
        <meta property="og:description" content="B├│i SIM phong thß╗ºy, xem quß║╗ chß╗º, hß╗úp mß╗çnh hß╗úp tuß╗òi." />
        <meta property="og:url" content="https://www.chonsomobifone.com/sim-phong-thuy" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqData.map((f) => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer }
          }))
        })}</script>
      </Helmet>
      <Header />
      <TrustBar />
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-center gap-2" style={{ color: '#F7C55A', textShadow: '0 0 12px rgba(247, 197, 90, 0.6)' }}>
              <Sparkles className="w-7 h-7" style={{ color: '#F7C55A' }} />
              B├│i 4 Sß╗æ ─Éu├┤i / 6 Sß╗æ ─Éu├┤i SIM
            </h1>
            <p style={{ color: 'rgba(237, 237, 237, 0.65)' }} className="text-sm md:text-base">
              Tra cß╗⌐u ├╜ ngh─⌐a sß╗æ ─æu├┤i SIM theo 80 quß║╗ Kinh Dß╗ïch
            </p>
          </div>

          {/* Card 1: Input Form */}
          <div className={cardBaseClass} style={cardStyle}>
            <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: '#EDEDED' }}>
              <Search className="w-5 h-5" style={{ color: '#F7C55A' }} />
              Nhß║¡p sß╗æ cß║ºn tra cß╗⌐u
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Input */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="phone" style={{ color: '#EDEDED' }} className="text-sm">
                    Sß╗æ ─æiß╗çn thoß║íi hoß║╖c sß╗æ ─æu├┤i
                  </Label>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="VD: 0909.123.456 hoß║╖c 3456"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="bg-black/50 border-[rgba(245,194,107,0.3)] text-white placeholder:text-gray-500 focus:border-[#F7C55A] focus:ring-[#F7C55A]/30 h-14 md:h-16 text-2xl md:text-3xl"
                  />
                  <p style={{ color: 'rgba(237, 237, 237, 0.5)' }} className="text-xs">
                    C├│ thß╗â nhß║¡p 4 sß╗æ, 6 sß╗æ, hoß║╖c sß╗æ ─æiß╗çn thoß║íi ─æß║ºy ─æß╗º (c├│ thß╗â c├│ dß║Ñu chß║Ñm/khoß║úng trß║»ng)
                  </p>
                </div>

                {/* Suffix Length */}
                <div className="space-y-2">
                  <Label style={{ color: '#EDEDED' }} className="text-sm">─Éß╗Ö d├ái tra cß╗⌐u</Label>
                  <Select value={suffixLength} onValueChange={(v) => setSuffixLength(v as '4' | '6')}>
                    <SelectTrigger className="bg-black/50 border-[rgba(245,194,107,0.3)] text-white focus:border-[#F7C55A] focus:ring-[#F7C55A]/30 h-14 md:h-16 text-lg md:text-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-[rgba(245,194,107,0.3)]">
                      <SelectItem value="4" className="text-white hover:bg-neutral-800 text-lg md:text-xl">4 sß╗æ cuß╗æi</SelectItem>
                      <SelectItem value="6" className="text-white hover:bg-neutral-800 text-lg md:text-xl">6 sß╗æ cuß╗æi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-300 text-sm bg-red-950/50 border border-red-400/50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full md:w-auto text-white border-0"
                style={{ 
                  background: 'linear-gradient(135deg, #ff3b3b, #ff7a18)', 
                  boxShadow: '0 6px 20px rgba(255, 90, 50, 0.45)' 
                }}
              >
                <Search className="w-4 h-4 mr-2" />
                Tra cß╗⌐u
              </Button>
            </form>
          </div>

          {/* Card 2: Result Section */}
          {result && (
            <div className={`${cardBaseClass} mt-6 md:mt-8`} style={cardStyle}>
              {/* Header with Copy Link */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2" style={{ color: '#EDEDED' }}>
                  <Sparkles className="w-5 h-5" style={{ color: '#F7C55A' }} />
                  Kß║┐t quß║ú tra cß╗⌐u
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyLink}
                  className="bg-black/40 hover:bg-black/60 text-white"
                  style={{ 
                    border: '1px solid rgba(245, 194, 107, 0.45)',
                    boxShadow: '0 0 10px rgba(245, 194, 107, 0.2)'
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" style={{ color: '#F7C55A' }} />
                  Copy link
                </Button>
              </div>

              <div className="space-y-4">
                {/* Result Grid */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {/* Suffix Display */}
                  <div 
                    className="text-center p-3 md:p-4 rounded-xl"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)', 
                      border: '1px solid rgba(245, 194, 107, 0.25)'
                    }}
                  >
                    <p className="text-xs md:text-sm mb-2" style={{ color: 'rgba(237, 237, 237, 0.65)' }}>Sß╗æ cuß╗æi tra cß╗⌐u</p>
                    <p className="text-4xl md:text-6xl font-bold tracking-wider" style={{ color: '#F7C55A' }}>{result.suffix}</p>
                  </div>

                  {/* Que Number */}
                  <div 
                    className="text-center p-3 md:p-4 rounded-xl"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)', 
                      border: '1px solid rgba(245, 194, 107, 0.25)'
                    }}
                  >
                    <p className="text-xs md:text-sm mb-2" style={{ color: 'rgba(237, 237, 237, 0.65)' }}>Quß║╗ sß╗æ</p>
                    <p className="text-4xl md:text-6xl font-bold" style={{ color: '#FFFFFF' }}>{result.que}</p>
                  </div>
                </div>

                {/* Hexagram Title - Luß║¡n giß║úi */}
                <div 
                  className="rounded-xl p-4"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.06)', 
                    border: '1px solid rgba(245, 194, 107, 0.25)'
                  }}
                >
                  <p className="text-xs md:text-sm mb-2 text-center" style={{ color: 'rgba(237, 237, 237, 0.65)' }}>Luß║¡n giß║úi</p>
                  <p className="text-3xl md:text-4xl text-center" style={{ color: '#f5f5f5' }}>
                    "{result.hexagram.title}"
                  </p>
                </div>

                {/* Level Badge - ─É├ính gi├í */}
                <div className="text-center">
                  <p className="text-xs md:text-sm mb-2" style={{ color: 'rgba(237, 237, 237, 0.65)' }}>─É├ính gi├í</p>
                  <Badge className={`text-2xl md:text-3xl px-8 py-4 border font-semibold ${getLevelBadgeClass(result.hexagram.level)}`}>
                    {result.hexagram.level}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Gß╗úi ├╜ SIM ─Éß║íi c├ít / C├ít - Real SIMs from inventory */}
          <div className={`${cardBaseClass} mt-6 md:mt-8`} style={cardStyle}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <h2 className="text-lg font-semibold" style={{ color: '#F7C55A', textShadow: '0 0 8px rgba(247, 197, 90, 0.4)' }}>
                Gß╗úi ├╜ SIM ─Éß║íi c├ít / C├ít (theo {suffixLength} sß╗æ ─æu├┤i)
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuggestionSeed(Date.now())}
                className="bg-black/40 hover:bg-black/60 text-white"
                style={{ 
                  border: '1px solid rgba(245, 194, 107, 0.45)',
                  boxShadow: '0 0 10px rgba(245, 194, 107, 0.2)'
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" style={{ color: '#F7C55A' }} />
                L├ám mß╗¢i gß╗úi ├╜
              </Button>
            </div>
            
            {!inventoryLoaded ? (
              <div className="text-center py-8">
                <p style={{ color: 'rgba(237, 237, 237, 0.7)' }}>─Éang tß║úi kho SIM...</p>
              </div>
            ) : luckySuggestions.luckyGreat.length === 0 && luckySuggestions.luckyGood.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ color: 'rgba(237, 237, 237, 0.7)' }}>Kh├┤ng t├¼m thß║Ñy SIM ph├╣ hß╗úp trong kho.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Section ─Éß║íi c├ít */}
                {luckySuggestions.luckyGreat.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: '#2ecc71' }}>
                      <span className="inline-block w-3 h-3 rounded-full bg-[#2ecc71]"></span>
                      ─Éß║íi c├ít ({luckySuggestions.luckyGreat.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {luckySuggestions.luckyGreat.map((entry, idx) => (
                        <div
                          key={`great-${idx}`}
                          className="rounded-lg p-6 flex flex-col gap-3"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.06)', 
                            backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(46, 204, 113, 0.35)'
                          }}
                        >
                          {/* Phone number - hiß╗ân thß╗ï ─æ├║ng tß╗½ cß╗Öt "Sß╗É THU├è BAO" */}
                          <p className="font-mono text-xl md:text-2xl font-semibold" style={{ color: '#F7C55A' }}>
                            {entry.item.phone}
                          </p>
                          
                          {/* Price */}
                          <p className="text-lg md:text-xl font-medium text-white">
                            {formatPriceVND(entry.item.price)}
                          </p>
                          
                          {/* Level Badge */}
                          <Badge className={`w-fit text-base md:text-lg px-5 py-2 border font-semibold ${getLevelBadgeClass(entry.level)}`}>
                            {entry.level}
                          </Badge>
                          
                          {/* Buy button */}
                          <Button
                            size="lg"
                            className="mt-2 text-white border-0 text-base md:text-lg py-3"
                            style={{ 
                              background: 'linear-gradient(135deg, #ff3b3b, #ff7a18)', 
                              boxShadow: '0 4px 12px rgba(255, 90, 50, 0.35)' 
                            }}
                            onClick={() => handleBuyNow(entry.item)}
                          >
                            Mua ngay
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section C├ít */}
                {luckySuggestions.luckyGood.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: '#27ae60' }}>
                      <span className="inline-block w-3 h-3 rounded-full bg-[#27ae60]"></span>
                      C├ít ({luckySuggestions.luckyGood.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {luckySuggestions.luckyGood.map((entry, idx) => (
                        <div
                          key={`good-${idx}`}
                          className="rounded-lg p-6 flex flex-col gap-3"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.06)', 
                            backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(39, 174, 96, 0.35)'
                          }}
                        >
                          {/* Phone number - hiß╗ân thß╗ï ─æ├║ng tß╗½ cß╗Öt "Sß╗É THU├è BAO" */}
                          <p className="font-mono text-xl md:text-2xl font-semibold" style={{ color: '#F7C55A' }}>
                            {entry.item.phone}
                          </p>
                          
                          {/* Price */}
                          <p className="text-lg md:text-xl font-medium text-white">
                            {formatPriceVND(entry.item.price)}
                          </p>
                          
                          {/* Level Badge */}
                          <Badge className={`w-fit text-base md:text-lg px-5 py-2 border font-semibold ${getLevelBadgeClass(entry.level)}`}>
                            {entry.level}
                          </Badge>
                          
                          {/* Buy button */}
                          <Button
                            size="lg"
                            className="mt-2 text-white border-0 text-base md:text-lg py-3"
                            style={{ 
                              background: 'linear-gradient(135deg, #ff3b3b, #ff7a18)', 
                              boxShadow: '0 4px 12px rgba(255, 90, 50, 0.35)' 
                            }}
                            onClick={() => handleBuyNow(entry.item)}
                          >
                            Mua ngay
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs mt-4 text-center" style={{ color: 'rgba(237, 237, 237, 0.5)' }}>
                  Click "Mua ngay" ─æß╗â ─æß║╖t mua SIM. Gi├í hiß╗ân thß╗ï l├á gi├í thß╗▒c tß╗½ kho.
                </p>
              </div>
            )}
          </div>

          {/* Zalo Contact */}
          <div className="my-8 max-w-sm mx-auto">
            <ZaloChatCard />
          </div>

          {/* FAQ Section */}
          <div className={cardBaseClass} style={cardStyle}>
            <h2 className="text-lg font-semibold mb-5" style={{ color: '#F7C55A', textShadow: '0 0 8px rgba(247, 197, 90, 0.4)' }}>C├óu hß╗Åi th╞░ß╗¥ng gß║╖p</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} style={{ borderColor: 'rgba(245, 194, 107, 0.2)' }}>
                  <AccordionTrigger className="text-left hover:no-underline" style={{ color: '#EDEDED' }}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent style={{ color: 'rgba(237, 237, 237, 0.7)' }}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Disclaimer */}
          <div 
            className="rounded-xl p-5 text-center mt-8"
            style={{ 
              background: 'rgba(255, 255, 255, 0.06)', 
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(245, 194, 107, 0.25)'
            }}
          >
            <p className="text-sm" style={{ color: 'rgba(237, 237, 237, 0.8)' }}>
              <strong style={{ color: '#F7C55A' }}>L╞░u ├╜:</strong> Kß║┐t quß║ú b├│i sß╗æ ─æu├┤i SIM dß╗▒a tr├¬n 80 quß║╗ Kinh Dß╗ïch, chß╗ë mang t├¡nh chß║Ñt tham khß║úo v├á giß║úi tr├¡. 
              Viß╗çc lß╗▒a chß╗ìn SIM n├¬n kß║┐t hß╗úp nhiß╗üu yß║┐u tß╗æ phong thß╗ºy kh├íc nh╞░ ng┼⌐ h├ánh, b├ít tß╗▒, tß╗òng sß╗æ n├║t...
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SimPhongThuy;
