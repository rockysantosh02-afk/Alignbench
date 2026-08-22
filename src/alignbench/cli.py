from alignbench.config import get_config
def main():
    config = get_config()
    print("welcome to AlignBench!")
    print(f"Project Name: {config['project_name']}")
    print(f"Version: {config['version']}")
    print(f"Environment: {config['environment']}")  
    print("I am learning Python by building a real project.")
    print('''================================
            ALIGNBENCH
    ================================
    Starting benchmark...
    Environment: Development
    Status: Ready
    ================================''')

if __name__=="__main__":
    main() 
     