import pygame
import sys
import math
import random

# Initialize Pygame
pygame.init()

# Constants
WIDTH, HEIGHT = 400, 700
BALL_RADIUS = 15
PLATFORM_WIDTH = 200
PLATFORM_HEIGHT = 20
GAP_SIZE = 60
ROTATION_SPEED = 0.5
GRAVITY = 0.4
BOUNCE_FACTOR = 0.7
PLATFORM_COUNT = 20
FPS = 60

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 50, 50)
GREEN = (50, 255, 50)
BLUE = (50, 100, 255)
YELLOW = (255, 255, 50)
BALL_COLOR = (255, 200, 50)
BACKGROUND = (20, 20, 40)

# Set up the display
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Helix Jump Clone")
clock = pygame.time.Clock()

class Ball:
    def __init__(self):
        self.x = WIDTH // 2
        self.y = HEIGHT // 4
        self.radius = BALL_RADIUS
        self.vel_y = 0
        self.color = BALL_COLOR
    
    def update(self):
        self.vel_y += GRAVITY
        self.y += self.vel_y
        
        # Check if ball falls off the bottom
        if self.y > HEIGHT + self.radius:
            return False
        return True
    
    def bounce(self):
        self.vel_y = -self.vel_y * BOUNCE_FACTOR
    
    def draw(self):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.radius)
        # Add a highlight to make the ball look more 3D
        pygame.draw.circle(screen, (255, 230, 150), 
                          (int(self.x - self.radius//3), int(self.y - self.radius//3)), 
                          self.radius//3)

class Platform:
    def __init__(self, y_pos, gap_position):
        self.y = y_pos
        self.gap_position = gap_position  # Angle in radians where the gap starts
        self.gap_size = GAP_SIZE * (math.pi / 180)  # Convert to radians
        self.rotation = 0
        self.color = random.choice([RED, GREEN, BLUE, YELLOW])
    
    def update(self):
        self.rotation += ROTATION_SPEED * (math.pi / 180)  # Convert to radians
    
    def draw(self):
        # Draw the platform as a circular ring with a gap
        center_x, center_y = WIDTH // 2, self.y
        radius = PLATFORM_WIDTH // 2
        
        # Draw the colored segments
        segment_count = 36  # Number of segments to draw the ring
        segment_angle = 2 * math.pi / segment_count
        
        for i in range(segment_count):
            angle_start = i * segment_angle + self.rotation
            angle_end = (i + 1) * segment_angle + self.rotation
            
            # Skip drawing if this segment is in the gap
            gap_end = (self.gap_position + self.gap_size) % (2 * math.pi)
            if self.gap_position < gap_end:
                if angle_start >= self.gap_position and angle_end <= gap_end:
                    continue
            else:  # Gap wraps around 0
                if angle_start >= self.gap_position or angle_end <= gap_end:
                    continue
            
            # Calculate points for this segment
            start_x1 = center_x + radius * math.cos(angle_start)
            start_y1 = center_y + radius * math.sin(angle_start)
            start_x2 = center_x + (radius - PLATFORM_HEIGHT) * math.cos(angle_start)
            start_y2 = center_y + (radius - PLATFORM_HEIGHT) * math.sin(angle_start)
            
            end_x1 = center_x + radius * math.cos(angle_end)
            end_y1 = center_y + radius * math.sin(angle_end)
            end_x2 = center_x + (radius - PLATFORM_HEIGHT) * math.cos(angle_end)
            end_y2 = center_y + (radius - PLATFORM_HEIGHT) * math.sin(angle_end)
            
            # Draw the segment
            pygame.draw.polygon(screen, self.color, [
                (start_x1, start_y1),
                (start_x2, start_y2),
                (end_x2, end_y2),
                (end_x1, end_y1)
            ])
    
    def check_collision(self, ball):
        # Check if ball is at the same height as the platform
        if abs(ball.y - self.y) < ball.radius + PLATFORM_HEIGHT/2:
            # Calculate angle from center to ball
            dx = ball.x - WIDTH // 2
            dy = ball.y - self.y
            angle = math.atan2(dy, dx) % (2 * math.pi)
            
            # Adjust for platform rotation
            adjusted_angle = (angle - self.rotation) % (2 * math.pi)
            
            # Check if ball is in the gap
            gap_end = (self.gap_position + self.gap_size) % (2 * math.pi)
            
            if self.gap_position < gap_end:
                if adjusted_angle >= self.gap_position and adjusted_angle <= gap_end:
                    return False  # No collision, ball is in gap
            else:  # Gap wraps around 0
                if adjusted_angle >= self.gap_position or adjusted_angle <= gap_end:
                    return False  # No collision, ball is in gap
            
            # Ball hit the platform
            return True
        
        return False

class Game:
    def __init__(self):
        self.ball = Ball()
        self.platforms = []
        self.score = 0
        self.game_over = False
        self.scroll_speed = 2
        
        # Create initial platforms
        for i in range(PLATFORM_COUNT):
            y_pos = HEIGHT - i * 80  # Space platforms evenly
            gap_position = random.uniform(0, 2 * math.pi)
            self.platforms.append(Platform(y_pos, gap_position))
    
    def update(self):
        if self.game_over:
            return
        
        # Update ball
        if not self.ball.update():
            self.game_over = True
            return
        
        # Update platforms
        for platform in self.platforms:
            platform.update()
            
            # Check for collisions
            if platform.check_collision(self.ball):
                self.ball.bounce()
                self.score += 1
        
        # Scroll platforms downward to simulate ball falling
        for platform in self.platforms:
            platform.y += self.scroll_speed
            
            # If platform goes off screen, recycle it to the top
            if platform.y > HEIGHT + 100:
                platform.y = -100
                platform.gap_position = random.uniform(0, 2 * math.pi)
                platform.color = random.choice([RED, GREEN, BLUE, YELLOW])
    
    def draw(self):
        # Draw background
        screen.fill(BACKGROUND)
        
        # Draw platforms
        for platform in self.platforms:
            platform.draw()
        
        # Draw ball
        self.ball.draw()
        
        # Draw score
        font = pygame.font.SysFont(None, 36)
        score_text = font.render(f"Score: {self.score}", True, WHITE)
        screen.blit(score_text, (10, 10))
        
        # Draw game over message
        if self.game_over:
            font = pygame.font.SysFont(None, 48)
            game_over_text = font.render("GAME OVER", True, RED)
            screen.blit(game_over_text, (WIDTH//2 - game_over_text.get_width()//2, HEIGHT//2 - 50))
            
            restart_text = font.render("Press R to Restart", True, WHITE)
            screen.blit(restart_text, (WIDTH//2 - restart_text.get_width()//2, HEIGHT//2 + 10))
    
    def restart(self):
        self.__init__()

# Create game instance
game = Game()

# Main game loop
while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()
        
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_r and game.game_over:
                game.restart()
    
    # Update game state
    game.update()
    
    # Draw everything
    game.draw()
    
    # Update display
    pygame.display.flip()
    
    # Control frame rate
    clock.tick(FPS)