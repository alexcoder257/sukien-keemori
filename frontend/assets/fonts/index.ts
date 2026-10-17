/**
 * Barrel của kho font local. Mỗi họ chữ là **một thư mục con** chứa cả file
 * `.woff2` lẫn khai báo `localFont` của chính nó — thêm hay bỏ một họ chữ chỉ
 * đụng đúng một thư mục, và file này không phình theo số mẫu thiệp.
 *
 * Điểm vào duy nhất vẫn là `@/assets/fonts`; không import thẳng thư mục con để
 * chỗ khai báo font vẫn là một chỗ duy nhất.
 *
 * Sắp theo vai trong thiệp — script, serif display, serif body, sans — chứ
 * không theo bảng chữ cái: khi chọn bộ ba font cho một mẫu thì đọc theo vai là
 * đúng thứ tự cần.
 */

// Script — tên cặp đôi, accent ngắn.
export { charm } from "./charm";
export { charmonman } from "./charmonman";
export { greatVibes } from "./great-vibes";
export { hurricane } from "./hurricane";
export { momoSignature } from "./momo-signature";
export { storyScript } from "./story-script";

// Display — măng sét, tiêu đề mục.
export { grenzeGotisch } from "./grenze-gotisch";
export { playfairDisplay } from "./playfair-display";
export { prata } from "./prata";

// Serif — heading và thân bài.
export { cormorant } from "./cormorant";
export { cormorantSc } from "./cormorant-sc";
export { ebGaramond, ebGaramondDigits } from "./eb-garamond";
export { lora } from "./lora";
export { newsreader } from "./newsreader";
export { spectral } from "./spectral";

// Sans — giao diện app và thân bài của mẫu hiện đại.
export { beVietnamPro } from "./be-vietnam-pro";
export { inter } from "./inter";

// Calligraphy and numerals from the Doha stationery reference.
export { uvnHoaTay } from "./uvn-hoa-tay";
export { beyondPerfection } from "./beyond-perfection";
export { arcittyaBegatri } from "./arcittya-begatri";
export { hastegi } from "./hastegi";
