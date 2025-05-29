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
        
        this.init();
    }

    init() {
        // Bind mouse tracking to the chatbox
        const chatbox = document.querySelector('.chatbox');
        if (chatbox) {
            chatbox.addEventListener('mousemove', this.handleMouseMove.bind(this));
            chatbox.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        }
    }

    handleMouseMove(event) {
        const now = performance.now();
        if (now - this.lastUpdate < this.updateThreshold) return;
        
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        this.lastUpdate = now;
        
        console.log('Mouse move:', this.mouseX, this.mouseY);
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.animationFrameId = requestAnimationFrame(() => {
            this.updateCharacterColors();
        });
    }

    handleMouseLeave() {
        // Reset all character colors when mouse leaves chatbox
        const charSpans = document.querySelectorAll('.chatbox .char-span');
        charSpans.forEach(span => {
            span.style.color = '';
            span.style.textShadow = '';
        });
    }

    updateCharacterColors() {
        const charSpans = document.querySelectorAll('.chatbox .char-span');
        
        charSpans.forEach(span => {
            const rect = span.getBoundingClientRect();
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
        
        // Get current theme
        const isDarkMode = !document.body.hasAttribute('data-theme') ||
                          document.body.getAttribute('data-theme') === 'dark';
        
        if (isDarkMode) {
            // Dark mode: very dramatic cyan/bright blue effect
            if (intensity > 0.7) {
                // Very close - bright cyan
                span.style.setProperty('color', '#00ffff', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 20}px #00ffff, 0 0 ${intensity * 30}px #00ffff`, 'important');
            } else if (intensity > 0.4) {
                // Medium distance - bright blue
                span.style.setProperty('color', '#4080ff', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 15}px #4080ff`, 'important');
            } else {
                // Far but still affected - light blue
                span.style.setProperty('color', '#8080ff', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 10}px #8080ff`, 'important');
            }
        } else {
            // Light mode: very dramatic blue effect
            if (intensity > 0.7) {
                // Very close - bright blue
                span.style.setProperty('color', '#0040ff', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 20}px #0040ff, 0 0 ${intensity * 30}px #0040ff`, 'important');
            } else if (intensity > 0.4) {
                // Medium distance - medium blue
                span.style.setProperty('color', '#4080ff', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 15}px #4080ff`, 'important');
            } else {
                // Far but still affected - light blue
                span.style.setProperty('color', '#6090ff', 'important');
                span.style.setProperty('text-shadow', `0 0 ${intensity * 10}px #6090ff`, 'important');
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
        textNode.parentNode.replaceChild(fragment, textNode);
    }

    /**
     * Apply character wrapping to a chat message element
     * @param {HTMLElement} chatElement - The chat li element
     */
    applyCursorEffect(chatElement) {
        if (!chatElement || !this.isEnabled) return;
        
        const messageElement = chatElement.querySelector('p');
        if (messageElement) {
            // Small delay to ensure content is fully rendered
            setTimeout(() => {
                this.wrapCharactersInSpans(messageElement);
            }, 10);
        }
    }

    /**
     * Enable or disable the cursor effect
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            // Clean up existing spans
            const charSpans = document.querySelectorAll('.chatbox .char-span');
            charSpans.forEach(span => {
                const parent = span.parentNode;
                parent.replaceChild(document.createTextNode(span.textContent), span);
                parent.normalize(); // Merge adjacent text nodes
            });
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        const chatbox = document.querySelector('.chatbox');
        if (chatbox) {
            chatbox.removeEventListener('mousemove', this.handleMouseMove.bind(this));
            chatbox.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
        }
        
        this.setEnabled(false);
    }
}

// Export for use in other modules
window.ChatCursorEffect = ChatCursorEffect;