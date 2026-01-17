import { useEffect } from 'react';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    FB?: {
      init: (config: { xfbml: boolean; version: string }) => void;
      CustomerChat?: {
        show: (shouldOpen?: boolean) => void;
        hide: () => void;
      };
      XFBML?: {
        parse: () => void;
      };
    };
    fbAsyncInit?: () => void;
    __openMessengerChat?: () => boolean;
    __messengerReady?: boolean;
  }
}

const PAGE_ID = '111745910591052';
const GREETING_MESSAGE = 'Chào shop, tôi cần tư vấn sim số đẹp';

const MessengerChatPlugin = () => {
  useEffect(() => {
    // Create fb-root if not exists
    if (!document.getElementById('fb-root')) {
      const fbRoot = document.createElement('div');
      fbRoot.id = 'fb-root';
      document.body.insertBefore(fbRoot, document.body.firstChild);
    }

    // Create chat plugin container if not exists
    if (!document.querySelector('.fb-customerchat')) {
      const chatDiv = document.createElement('div');
      chatDiv.className = 'fb-customerchat';
      chatDiv.setAttribute('attribution', 'biz_inbox');
      chatDiv.setAttribute('page_id', PAGE_ID);
      chatDiv.setAttribute('theme_color', '#0068ff');
      chatDiv.setAttribute('greeting_dialog_display', 'hide');
      chatDiv.setAttribute('logged_in_greeting', GREETING_MESSAGE);
      chatDiv.setAttribute('logged_out_greeting', GREETING_MESSAGE);
      document.body.appendChild(chatDiv);
    }

    // Define global function to open chat
    window.__openMessengerChat = () => {
      if (window.FB?.CustomerChat?.show) {
        window.FB.CustomerChat.show(true);
        return true;
      }
      return false;
    };

    // Initialize Facebook SDK
    window.fbAsyncInit = function () {
      window.FB?.init({
        xfbml: true,
        version: 'v18.0',
      });

      // Parse XFBML after init
      if (window.FB?.XFBML?.parse) {
        window.FB.XFBML.parse();
      }
      
      window.__messengerReady = true;
    };

    // Load Facebook SDK asynchronously
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/vi_VN/sdk/xfbml.customerchat.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    // Cleanup
    return () => {
      delete window.__openMessengerChat;
      delete window.__messengerReady;
    };
  }, []);

  // Return null - no UI rendered
  return null;
};

export default MessengerChatPlugin;
