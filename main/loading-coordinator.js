/**
 * Loading Coordinator
 * Manages the loading sequence and ensures all components are ready before showing content
 */

class LoadingCoordinator {
    constructor() {
        this.readyComponents = new Set();
        this.requiredComponents = [
            'dom',
            'ascii-background',
            'portfolio-content',
            'chat-init',
            'speech-controllers',
            'chat-cursor-effect'
        ];
        this.loadingScreen = null;
        this.isLoaded = false;
        
        // Bind methods
        this.componentReady = this.componentReady.bind(this);
        this.checkAllReady = this.checkAllReady.bind(this);
        this.hideLoadingScreen = this.hideLoadingScreen.bind(this);
        
        this.init();
    }
    
    init() {
        this.loadingScreen = document.getElementById('loading-screen');
        
        // DOM is ready by default when this runs
        this.componentReady('dom');
        
        // Set a maximum loading time (fallback)
        setTimeout(() => {
            if (!this.isLoaded) {
                console.warn('Loading timeout reached, forcing content display');
                this.forceShowContent();
            }
        }, 5000);
    }
    
    componentReady(componentName) {
        if (this.isLoaded) return;
        
        console.log(`Component ready: ${componentName}`);
        this.readyComponents.add(componentName);
        this.checkAllReady();
    }
    
    checkAllReady() {
        if (this.isLoaded) return;
        
        const allReady = this.requiredComponents.every(component => 
            this.readyComponents.has(component)
        );
        
        if (allReady) {
            console.log('All components ready, initiating fade-in');
            this.hideLoadingScreen();
        } else {
            const remaining = this.requiredComponents.filter(component => 
                !this.readyComponents.has(component)
            );
            console.log(`Waiting for components: ${remaining.join(', ')}`);
        }
    }
    
    hideLoadingScreen() {
        if (this.isLoaded) return;
        
        this.isLoaded = true;
        
        // Add loaded class to body to show content
        document.body.classList.add('loaded');
        
        // Fade out loading screen
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('fade-out');
            
            // Remove loading screen after fade animation
            setTimeout(() => {
                if (this.loadingScreen && this.loadingScreen.parentNode) {
                    this.loadingScreen.parentNode.removeChild(this.loadingScreen);
                }
                this.triggerContentAnimations();
            }, 800);
        } else {
            this.triggerContentAnimations();
        }
    }
    
    triggerContentAnimations() {
        // Coordinated animation phases with synchronized timing
        // Vanilla JS implementation replacing jQuery animations
        
        // Helper function to animate opacity
        const animateOpacity = (element, delay, duration = 1000) => {
            if (!element) return;
            setTimeout(() => {
                element.style.transition = `opacity ${duration}ms ease`;
                element.style.opacity = '1';
            }, delay);
        };
        
        // Phase 1: Content reveal (0ms delay) - Main heading appears first
        animateOpacity(document.getElementById('heading'), 0);
        
        // Phase 2: Navigation (200ms delay) - Navigation elements appear together
        animateOpacity(document.getElementById('navbar'), 200);
        animateOpacity(document.getElementById('toggle-button'), 200);
        
        // Phase 3: Interactive elements (400ms delay) - Chat components appear together
        const initialMessage = document.querySelector('.initial-message');
        const materialSymbols = document.querySelector('.material-symbols-outlined');
        const chatInput = document.querySelector('.chat-input');
        
        animateOpacity(initialMessage, 400);
        animateOpacity(materialSymbols, 400);
        animateOpacity(chatInput, 400);
    }
    
    forceShowContent() {
        console.log('Forcing content display due to timeout');
        this.hideLoadingScreen();
    }
}

// Global instance
window.loadingCoordinator = new LoadingCoordinator();

// Export for module use
export default LoadingCoordinator;