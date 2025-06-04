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
        
        // Phase 1: Content reveal (0ms delay) - Main heading appears first
        $('#heading').delay(0).animate({"opacity": "1"}, 1000);
        
        // Phase 2: Navigation (200ms delay) - Navigation elements appear together
        $('#navbar').delay(200).animate({"opacity": "1"}, 1000);
        $('#toggle-button').delay(200).animate({"opacity": "1"}, 1000);
        
        // Phase 3: Interactive elements (400ms delay) - Chat components appear together
        $('.initial-message').delay(400).animate({"opacity": "1"}, 1000);
        $('.material-symbols-outlined').delay(400).animate({"opacity": "1"}, 1000);
        $('.chat-input').delay(400).animate({"opacity": "1"}, 1000);
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