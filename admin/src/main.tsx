
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  // Firebase is bootstrapped post-login inside AdminAppContext.
  // See admin/src/config/firebase.config.ts for full FCM setup.

  function applyDomMutationGuard() {
    const w = window as any;
    if (w.__FT_DOM_MUTATION_GUARD__) return;
    w.__FT_DOM_MUTATION_GUARD__ = true;

    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child && child.parentNode !== this) return child;
      try {
        return originalRemoveChild.call(this, child) as T;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') return child;
        throw error;
      }
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) return newNode;
      try {
        return originalInsertBefore.call(this, newNode, referenceNode) as T;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') return newNode;
        throw error;
      }
    };
  }

  applyDomMutationGuard();

  createRoot(document.getElementById("root")!).render(<App />);
  