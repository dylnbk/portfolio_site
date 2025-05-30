/**
 * Chat Cursor Effect System
 * Provides character-level hover effects for chat messages
 */

class ChatCursorEffect {
    constructor() {
        this.isEnabled = true;
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastUpdate = 0;
        this.updateThreshold = 16; // ~60fps throttling
        this.maxDistance = 100; // Maximum distance for effect
        this.animationFrameId = null;
        this.animationFrameIdScroll = null; // For scroll-triggered cache updates
        this.lastScrollUpdate = 0;

        this.chatboxElement = null;
        this.characterSpans = [];
        this.characterPositions = []; // To store { span, rect }
        this.isDarkMode = false;

        // Bound event handlers
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
        this.boundHandleResize = this.handleResize.bind(this);
        this.boundMutationObserverCallback = this.handleMutations.bind(this);
        this.boundHandleScroll = this.handleScroll.bind(this); // For scroll events

        // Bound touch event handlers
        this.boundHandleTouchStart = this.handleTouchStart.bind(this);
        this.boundHandleTouchMove = this.handleTouchMove.bind(this);
        this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);

        this.mutationObserver = null;
        
        // Wait for DOM ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        if (!this.isEnabled) return;

        this.chatboxElement = document.querySelector('.chatbox');
        if (!this.chatboxElement) {
            console.warn('ChatCursorEffect: Chatbox element not found.');
            return;
        }

        this.updateThemeStatus();
        this.chatboxElement.addEventListener('mousemove', this.boundHandleMouseMove);
        this.chatboxElement.addEventListener('mouseleave', this.boundHandleMouseLeave);
        window.addEventListener('resize', this.boundHandleResize);
        if (this.chatboxElement) { // Check as it might not be found
            this.chatboxElement.addEventListener('scroll', this.boundHandleScroll);
            // Add touch event listeners
            this.chatboxElement.addEventListener('touchstart', this.boundHandleTouchStart, { passive: true });
            this.chatboxElement.addEventListener('touchmove', this.boundHandleTouchMove, { passive: true });
            this.chatboxElement.addEventListener('touchend', this.boundHandleTouchEnd);
        }

        // Initial processing of existing messages
        this.processAllMessages();

        // Observe for new messages
        this.mutationObserver = new MutationObserver(this.boundMutationObserverCallback);
        this.mutationObserver.observe(this.chatboxElement, { childList: true, subtree: true });

        // Observe for theme changes
        const themeObserver = new MutationObserver(() => this.updateThemeStatus());
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    }

    updateThemeStatus() {
        this.isDarkMode = !document.body.hasAttribute('data-theme') ||
                           document.body.getAttribute('data-theme') === 'dark';
    }

    handleResize() {
        if (!this.isEnabled) return;
        this.cacheCharacterPositions();
    }

    handleScroll() {
        if (!this.isEnabled) return;
        const now = performance.now();
        // Throttle scroll updates. Using a slightly higher threshold than mouse move.
        if (now - this.lastScrollUpdate < (this.updateThreshold * 2)) {
            return;
        }
        this.lastScrollUpdate = now;

        if (this.animationFrameIdScroll) {
            cancelAnimationFrame(this.animationFrameIdScroll);
        }
        this.animationFrameIdScroll = requestAnimationFrame(() => {
            this.cacheCharacterPositions();
            this.animationFrameIdScroll = null;
        });
    }
    
    handleMutations(mutationsList) {
        if (!this.isEnabled) return;
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if it's a message element or contains message elements
                        if (node.matches('li') || node.querySelector('li')) {
                             // Assuming new messages are added as <li> or contain <li>
                            this.processNewMessageElement(node.closest('li') || node);
                        }
                    }
                });
            }
        }
    }

    processNewMessageElement(messageElement) {
        if (!messageElement || !this.isEnabled) return;
        const messageContent = messageElement.querySelector('p'); // Adjust if structure is different
        if (messageContent) {
            this.wrapCharactersInSpans(messageContent);
            this.cacheCharacterPositions(); // Update cache after new spans are added
        }
    }
    
    processAllMessages() {
        if (!this.chatboxElement || !this.isEnabled) return;
        const messageElements = this.chatboxElement.querySelectorAll('li p'); // Adjust selector as needed
        messageElements.forEach(p => this.wrapCharactersInSpans(p));
        this.cacheCharacterPositions();
    }

    cacheCharacterPositions() {
        if (!this.isEnabled || !this.chatboxElement) return;
        this.characterSpans = Array.from(this.chatboxElement.querySelectorAll('.char-span'));
        this.characterPositions = this.characterSpans.map(span => {
            return { span, rect: span.getBoundingClientRect() };
        });
    }

    handleMouseMove(event) {
        if (!this.isEnabled) return;
        const now = performance.now();
        if (now - this.lastUpdate < this.updateThreshold) return;
        
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        this.lastUpdate = now;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.animationFrameId = requestAnimationFrame(() => {
            this.updateCharacterColors();
        });
    }

    handleMouseLeave() {
        if (!this.isEnabled) return;
        // Reset all character colors when mouse leaves chatbox
        this.characterPositions.forEach(({ span }) => {
            span.style.color = '';
            span.style.textShadow = '';
        });
    }

    handleTouchStart(event) {
        if (!this.isEnabled || !event.touches || event.touches.length === 0) return;
        const now = performance.now();
        if (now - this.lastUpdate < this.updateThreshold) return;
        
        this.mouseX = event.touches[0].clientX;
        this.mouseY = event.touches[0].clientY;
        this.lastUpdate = now;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.animationFrameId = requestAnimationFrame(() => {
            this.updateCharacterColors();
        });
    }

    handleTouchMove(event) {
        if (!this.isEnabled || !event.touches || event.touches.length === 0) return;
        const now = performance.now();
        // No need to check threshold again if touchstart already triggered,
        // but good for standalone touchmove if touchstart was missed or for consistency.
        // However, for continuous effect, we might want to update more frequently than mouse if possible,
        // or ensure the same throttling applies. Let's keep it consistent with mouseMove.
        if (now - this.lastUpdate < this.updateThreshold) return;

        this.mouseX = event.touches[0].clientX;
        this.mouseY = event.touches[0].clientY;
        this.lastUpdate = now;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.animationFrameId = requestAnimationFrame(() => {
            this.updateCharacterColors();
        });
    }

    handleTouchEnd() {
        if (!this.isEnabled) return;
        // Reset all character colors when touch ends, similar to mouseleave
        this.characterPositions.forEach(({ span }) => {
            span.style.color = '';
            span.style.textShadow = '';
        });
    }

    updateCharacterColors() {
        if (!this.isEnabled || this.characterPositions.length === 0) return;
        
        this.characterPositions.forEach(({ span, rect }) => {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(this.mouseX - centerX, 2) +
                Math.pow(this.mouseY - centerY, 2)
            );
            
            if (distance <= this.maxDistance) {
                this.applyColorEffect(span, distance);
            } else {
                // Reset color if outside max distance
                span.style.color = '';
                span.style.textShadow = '';
            }
        });
    }

    applyColorEffect(span, distance) {
        // Calculate intensity based on distance (closer = stronger effect)
        const intensity = Math.max(0, 1 - (distance / this.maxDistance));
        
        // Only apply effect if intensity is significant enough to be visible
        if (intensity < 0.1) {
            span.style.setProperty('color', '', 'important');
            span.style.setProperty('text-shadow', '', 'important');
            return;
        }
                
        if (this.isDarkMode) {
            if (intensity > 0.7) {
                span.style.setProperty('color', '#00ffff', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 20}px #00ffff, 0 0 ${intensity * 30}px #00ffff`, 'important');
            } else if (intensity > 0.4) {
                span.style.setProperty('color', '#4080ff', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 15}px #4080ff`, 'important');
            } else {
                span.style.setProperty('color', '#8080ff', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 10}px #8080ff`, 'important');
            }
        } else {
            
            if (intensity > 0.7) {
                span.style.setProperty('color', '#ff00c8', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 20}px rgb(255, 0, 200), 0 0 ${intensity * 30}px rgb(255, 0, 234)`, 'important');
            } else if (intensity > 0.4) {
                span.style.setProperty('color', '#b340ff', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 15}px rgb(179, 64, 255)`, 'important');
            } else {
                span.style.setProperty('color', '#7300e6', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 10}px rgb(25, 42, 188)`, 'important');
            }
        }
    }

    /**
     * Wrap individual characters in spans while preserving HTML structure
     * @param {HTMLElement} element - The element to process
     */
    wrapCharactersInSpans(element) {
        if (!element || !this.isEnabled) return;
        
        this.processTextNodes(element);
        // Note: Caching of positions will be handled by processAllMessages or processNewMessageElement
    }

    processTextNodes(node) {
        // Use a TreeWalker to find all text nodes
        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (textNode) => {
                    // Skip text nodes that are already inside char-span elements
                    if (textNode.parentElement &&
                        textNode.parentElement.classList.contains('char-span')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Only process text nodes with actual content
                    return textNode.textContent.trim().length > 0 ?
                           NodeFilter.FILTER_ACCEPT :
                           NodeFilter.FILTER_REJECT;
                }
            }
        );

        const textNodes = [];
        let textNode;
        while (textNode = walker.nextNode()) {
            textNodes.push(textNode);
        }

        // Process text nodes in reverse order to avoid DOM position issues
        textNodes.reverse().forEach(textNode => {
            this.wrapTextNodeCharacters(textNode);
        });
    }

    wrapTextNodeCharacters(textNode) {
        const text = textNode.textContent;
        if (!text || text.trim().length === 0) return;

        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char.trim().length === 0) {
                // Preserve whitespace as-is
                fragment.appendChild(document.createTextNode(char));
            } else {
                // Wrap non-whitespace characters in spans
                const span = document.createElement('span');
                span.className = 'char-span';
                span.textContent = char;
                fragment.appendChild(span);
            }
        }

        // Replace the original text node with the wrapped characters
        if (textNode.parentNode) { // Ensure parentNode exists
           textNode.parentNode.replaceChild(fragment, textNode);
        }
    }

    /**
     * This method is now effectively replaced by MutationObserver and processNewMessageElement.
     * It can be kept for manual triggering if needed, or removed.
     * For now, let's adapt it to re-process a specific element and update caches.
     * @param {HTMLElement} chatElement - The chat li element
     */
    applyCursorEffect(chatElement) {
        if (!chatElement || !this.isEnabled) return;
        this.processNewMessageElement(chatElement); // Re-process and update cache
    }

    /**
     * Enable or disable the cursor effect
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (enabled) {
            // Re-initialize if it was disabled
            if (!this.chatboxElement) {
                 // Wait for DOM ready before initializing
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => this.init());
                } else {
                    this.init();
                }
            } else {
                // Re-attach listeners and process messages if already initialized
                if (this.chatboxElement) {
                    this.chatboxElement.addEventListener('mousemove', this.boundHandleMouseMove);
                    this.chatboxElement.addEventListener('mouseleave', this.boundHandleMouseLeave);
                    this.chatboxElement.addEventListener('scroll', this.boundHandleScroll);
                }
                window.addEventListener('resize', this.boundHandleResize); // Stays on window
                if (this.mutationObserver && this.chatboxElement) {
                    this.mutationObserver.observe(this.chatboxElement, { childList: true, subtree: true });
                }
                this.processAllMessages();
            }
        } else {
            // Clean up existing spans and clear caches
            this.characterSpans.forEach(span => {
                if (span.parentNode) {
                    span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
                    span.parentNode.normalize(); // Merge adjacent text nodes
                }
            });
            this.characterSpans = [];
            this.characterPositions = [];

            if (this.chatboxElement) {
                this.chatboxElement.removeEventListener('mousemove', this.boundHandleMouseMove);
                this.chatboxElement.removeEventListener('mouseleave', this.boundHandleMouseLeave);
                this.chatboxElement.removeEventListener('scroll', this.boundHandleScroll);
                // Remove touch event listeners
                this.chatboxElement.removeEventListener('touchstart', this.boundHandleTouchStart);
                this.chatboxElement.removeEventListener('touchmove', this.boundHandleTouchMove);
                this.chatboxElement.removeEventListener('touchend', this.boundHandleTouchEnd);
            }
            window.removeEventListener('resize', this.boundHandleResize);
            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
            }
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            if (this.animationFrameIdScroll) { // Add this for scroll anim frame
                cancelAnimationFrame(this.animationFrameIdScroll);
                this.animationFrameIdScroll = null;
            }
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.setEnabled(false); // This now handles listener removal and cleanup

        // Ensure mutation observer is disconnected if not already by setEnabled(false)
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        
        // Nullify cached elements
        this.chatboxElement = null;
        this.characterSpans = [];
        this.characterPositions = [];

        // Cancel any pending animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.animationFrameIdScroll) {
            cancelAnimationFrame(this.animationFrameIdScroll);
            this.animationFrameIdScroll = null;
        }
        console.log('ChatCursorEffect destroyed.');
    }
}

// Export for use in other modules
window.ChatCursorEffect = ChatCursorEffect;

// Also export as ES module
export default ChatCursorEffect;