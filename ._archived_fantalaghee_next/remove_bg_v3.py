
from PIL import Image
import numpy as np

def remove_black_background(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        data = np.array(img)

        # Standard luminosity
        red, green, blue, alpha = data.T
        
        # Max channel brightness
        max_channel = np.maximum(np.maximum(red, green), blue)
        
        # STRICT THRESHOLDING
        # Any pixel with max brightness < 15 (out of 255) becomes fully transparent.
        # This kills the "dirty black" background.
        threshold = 15
        mask = max_channel > threshold
        
        # For pixels above threshold, we want a smooth ramp but starting from 0 visibility
        # Normalize (0-1) based on range [threshold, 255]
        norm_brightness = (max_channel - threshold) / (255.0 - threshold)
        norm_brightness = np.clip(norm_brightness, 0, 1)
        
        # Gamma correction to boost the glow of what remains
        gamma = 0.6
        boosted_alpha_norm = np.power(norm_brightness, gamma)
        
        # Calculate final alpha
        # Where mask is False (below threshold), alpha is 0.
        # Where mask is True, alpha is boosted_alpha_norm * 255
        
        final_alpha = np.zeros_like(max_channel, dtype=np.uint8)
        final_alpha[mask] = (boosted_alpha_norm[mask] * 255).astype(np.uint8)
        
        # Apply to alpha channel
        data[..., 3] = final_alpha

        new_img = Image.fromarray(data)
        new_img.save(output_path, "PNG")
        print(f"Saved CLEAN transparent logo to {output_path}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    input_file = "/home/brianza_boy/.gemini/antigravity/brain/7fa77159-02b3-4b62-9750-9d42eff8f878/logo_neon_3d_v7_perfect_l_1769888461913.png"
    output_file = "/home/brianza_boy/Fantalaghee/fantalaghee/fantalaghee-next/public/image/logo-neon-transparent.png"
    remove_black_background(input_file, output_file)
