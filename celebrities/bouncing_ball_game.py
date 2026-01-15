import pygame
import sys
import random
import os

# Initialize Pygame
pygame.init()
pygame.mixer.init()  # Initialize mixer for audio

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
BALL_RADIUS = 20
BALL_SPEED_X = 5
BALL_SPEED_Y = 5
PADDLE_WIDTH = 100
PADDLE_HEIGHT = 15
PADDLE_SPEED = 8
FPS = 60
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
BLUE = (0, 0, 255)

# Audio files (place these in the same directory as the script)
BG_MUSIC_FILE = 'background_music.mp3'  # Loopable background track
BOUNCE_SOUND_FILE = 'bounce.wav'  # Short sound for wall bounces
PADDLE_HIT_SOUND_FILE = 'paddle_hit.wav'  # Sound for paddle collision
LOSE_LIFE_SOUND_FILE = 'lose_life.wav'  # Sound for losing a life
GAME_OVER_SOUND_FILE = 'game_over.wav'  # Sound for game over

# Set up the display
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Professional Bouncing Ball Game with Audio")
clock = pygame.time.Clock()

class Ball:
    """Represents the bouncing ball."""
    def __init__(self):
        self.x = SCREEN_WIDTH // 2
        self.y = SCREEN_HEIGHT // 2
        self.speed_x = BALL_SPEED_X * random.choice([-1, 1])
        self.speed_y = BALL_SPEED_Y * random.choice([-1, 1])
        self.color = RED

    def move(self):
        """Update ball position and handle wall collisions."""
        self.x += self.speed_x
        self.y += self.speed_y

        # Bounce off walls
        wall_bounce = False
        if self.x - BALL_RADIUS <= 0 or self.x + BALL_RADIUS >= SCREEN_WIDTH:
            self.speed_x = -self.speed_x
            wall_bounce = True
        if self.y - BALL_RADIUS <= 0:
            self.speed_y = -self.speed_y
            wall_bounce = True
        if wall_bounce:
            play_sound(BOUNCE_SOUND_FILE)

    def draw(self, surface):
        """Draw the ball on the surface."""
        pygame.draw.circle(surface, self.color, (int(self.x), int(self.y)), BALL_RADIUS)

    def reset(self):
        """Reset ball to center with random direction."""
        self.x = SCREEN_WIDTH // 2
        self.y = SCREEN_HEIGHT // 2
        self.speed_x = BALL_SPEED_X * random.choice([-1, 1])
        self.speed_y = BALL_SPEED_Y * random.choice([-1, 1])

class Paddle:
    """Represents the player-controlled paddle."""
    def __init__(self):
        self.x = (SCREEN_WIDTH - PADDLE_WIDTH) // 2
        self.y = SCREEN_HEIGHT - PADDLE_HEIGHT - 10
        self.width = PADDLE_WIDTH
        self.height = PADDLE_HEIGHT
        self.color = BLUE

    def move_left(self):
        """Move paddle left if possible."""
        if self.x > 0:
            self.x -= PADDLE_SPEED

    def move_right(self):
        """Move paddle right if possible."""
        if self.x < SCREEN_WIDTH - self.width:
            self.x += PADDLE_SPEED

    def draw(self, surface):
        """Draw the paddle on the surface."""
        pygame.draw.rect(surface, self.color, (self.x, self.y, self.width, self.height))

def load_audio_files():
    """Load and return audio files if they exist."""
    sounds = {}
    if os.path.exists(BG_MUSIC_FILE):
        pygame.mixer.music.load(BG_MUSIC_FILE)
        pygame.mixer.music.play(-1)  # Loop indefinitely
        pygame.mixer.music.set_volume(0.5)  # Set background volume
    else:
        print(f"Warning: {BG_MUSIC_FILE} not found. Background music disabled.")

    for sound_file in [BOUNCE_SOUND_FILE, PADDLE_HIT_SOUND_FILE, LOSE_LIFE_SOUND_FILE, GAME_OVER_SOUND_FILE]:
        if os.path.exists(sound_file):
            sounds[sound_file] = pygame.mixer.Sound(sound_file)
            sounds[sound_file].set_volume(0.7)  # Set sound effect volume
        else:
            print(f"Warning: {sound_file} not found. Sound effect disabled.")
            sounds[sound_file] = None
    return sounds

def play_sound(sound_key):
    """Play a sound if loaded."""
    if sounds.get(sound_key):
        sounds[sound_key].play()

def check_collision(ball, paddle):
    """Check if ball collides with paddle and update direction."""
    ball_rect = pygame.Rect(ball.x - BALL_RADIUS, ball.y - BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2)
    paddle_rect = pygame.Rect(paddle.x, paddle.y, paddle.width, paddle.height)

    if ball_rect.colliderect(paddle_rect):
        ball.speed_y = -abs(ball.speed_y)  # Bounce upwards
        # Adjust horizontal speed based on hit position for more realism
        hit_pos = (ball.x - paddle.x) / paddle.width
        ball.speed_x = (hit_pos - 0.5) * 10  # Range from -5 to 5
        play_sound(PADDLE_HIT_SOUND_FILE)
        return True
    return False

def main():
    """Main game loop."""
    global sounds
    sounds = load_audio_files()  # Load audio at start

    ball = Ball()
    paddle = Paddle()
    score = 0
    lives = 3
    font = pygame.font.Font(None, 36)

    running = True
    while running:
        # Handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r and not running:  # Restart on 'R'
                    pygame.mixer.music.stop()  # Stop music on restart
                    main()

        # Handle continuous key presses
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]:
            paddle.move_left()
        if keys[pygame.K_RIGHT]:
            paddle.move_right()

        # Update game objects
        ball.move()
        collision = check_collision(ball, paddle)

        # Check if ball hits bottom (lose life)
        if ball.y + BALL_RADIUS > SCREEN_HEIGHT:
            play_sound(LOSE_LIFE_SOUND_FILE)
            lives -= 1
            if lives <= 0:
                # Game over
                play_sound(GAME_OVER_SOUND_FILE)
                pygame.mixer.music.stop()  # Stop background music
                screen.fill(BLACK)
                game_over_text = font.render("Game Over! Score: " + str(score), True, WHITE)
                restart_text = font.render("Press R to restart", True, WHITE)
                screen.blit(game_over_text, (SCREEN_WIDTH // 2 - 150, SCREEN_HEIGHT // 2))
                screen.blit(restart_text, (SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT // 2 + 40))
                pygame.display.flip()
                waiting = True
                while waiting:
                    for event in pygame.event.get():
                        if event.type == pygame.QUIT:
                            sys.exit()
                        if event.type == pygame.KEYDOWN and event.key == pygame.K_r:
                            return main()
                running = False
            else:
                ball.reset()

        # Increase score on paddle hit
        if collision:
            score += 1

        # Draw everything
        screen.fill(BLACK)
        ball.draw(screen)
        paddle.draw(screen)

        # Draw UI
        score_text = font.render("Score: " + str(score), True, WHITE)
        lives_text = font.render("Lives: " + str(lives), True, WHITE)
        screen.blit(score_text, (10, 10))
        screen.blit(lives_text, (10, 50))

        pygame.display.flip()
        clock.tick(FPS)

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()