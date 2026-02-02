
from PIL import Image
import numpy as np

def remove_black_background(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        data = np.array(img)

        # Standard luminosity
        red, green, blue, alpha = data.T
        
        # Max channel brightness determines the "base" visibility
        max_channel = np.maximum(np.maximum(red, green), blue)
        
        # KEY CHANGE: Apply Gamma Correction (Non-linear curve)
        # Instead of linear mapping, we bend the curve so faint pixels (low brightness) get HIGHER alpha
        # normalized (0-1)
        norm_brightness = max_channel / 255.0
        
        # Gamma < 1 boosts shadows. Let's use 0.5 to make dim glowing parts much more visible.
        # But we still want pure black (0) to remain 0.
        gamma = 0.5
        boosted_alpha_norm = np.power(norm_brightness, gamma)
        
        # Scale back to 0-255
        boosted_alpha = np.clip(boosted_alpha_norm * 255, 0, 255).astype(np.uint8)
        
        # Extra boost multiplier for safety on very dim edges
        boosted_alpha = np.clip(boosted_alpha * 1.2, 0, 255).astype(np.uint8)
        
        # Apply to alpha channel
        data[..., 3] = boosted_alpha

        new_img = Image.fromarray(data)
        new_img.save(output_path, "PNG")
        print(f"Saved refined transparent logo to {output_path}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    input_file = "/home/brianza_boy/.gemini/antigravity/brain/7fa77159-02b3-4b62-9750-9d42eff8f878/logo_neon_3d_v7_perfect_l_1769888461913.png"
    output_file = "/home/brianza_boy/Fantalaghee/fantalaghee/fantalaghee-next/public/image/logo-neon-transparent.png"
    remove_black_background(input_file, output_file)
